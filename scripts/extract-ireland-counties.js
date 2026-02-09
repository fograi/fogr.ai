#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const inputPath = resolve(process.cwd(), process.argv[2] ?? 'ireland_counties.html');
const outputPath = resolve(process.cwd(), process.argv[3] ?? 'ireland_counties.json');

const namedEntities = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' '
};

function decodeHtmlEntities(text) {
  return text.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]+);/g, (match, entity) => {
    if (entity.startsWith('#x')) {
      const codePoint = Number.parseInt(entity.slice(2), 16);
      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
    }

    if (entity.startsWith('#')) {
      const codePoint = Number.parseInt(entity.slice(1), 10);
      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
    }

    return namedEntities[entity] ?? match;
  });
}

function parseCounties(html) {
  const counties = [];
  const selectRegex = /<select\b([^>]*)>([\s\S]*?)<\/select>/gi;
  let selectMatch;

  while ((selectMatch = selectRegex.exec(html)) !== null) {
    const attributes = selectMatch[1];
    const optionsHtml = selectMatch[2];
    const countyNameMatch = attributes.match(/\bname="([^"]+)"/i);

    if (!countyNameMatch) {
      throw new Error(`Found <select> without a name attribute at index ${selectMatch.index}`);
    }

    const county = decodeHtmlEntities(countyNameMatch[1].trim());
    const areas = [];
    const optionRegex = /<option\b[^>]*>([\s\S]*?)<\/option>/gi;
    let optionMatch;

    while ((optionMatch = optionRegex.exec(optionsHtml)) !== null) {
      const rawLabel = optionMatch[1].trim();
      const label = decodeHtmlEntities(rawLabel);
      areas.push(label);
    }

    counties.push({ county, areas });
  }

  return counties;
}

function verifyExtraction(html, counties) {
  const rawSelectCount = (html.match(/<select\b/gi) ?? []).length;
  const rawOptionCount = (html.match(/<option\b/gi) ?? []).length;
  const parsedSelectCount = counties.length;
  const parsedOptionCount = counties.reduce((sum, county) => sum + county.areas.length, 0);

  if (parsedSelectCount !== rawSelectCount) {
    throw new Error(
      `County count mismatch: parsed ${parsedSelectCount}, source has ${rawSelectCount}`
    );
  }

  if (parsedOptionCount !== rawOptionCount) {
    throw new Error(`Area count mismatch: parsed ${parsedOptionCount}, source has ${rawOptionCount}`);
  }

  for (const entry of counties) {
    if (!entry.county) {
      throw new Error('Encountered empty county name in parsed output');
    }

    if (!Array.isArray(entry.areas)) {
      throw new Error(`County ${entry.county} has non-array areas field`);
    }

    for (let i = 0; i < entry.areas.length; i += 1) {
      const area = entry.areas[i];
      if (!area) {
        throw new Error(`County ${entry.county} has an empty area at index ${i}`);
      }
    }
  }

  return { rawSelectCount, rawOptionCount };
}

function verifyWrittenOutput(serialized, parsedData) {
  let parsedFile;
  try {
    parsedFile = JSON.parse(serialized);
  } catch (error) {
    throw new Error(`Output JSON is invalid: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (JSON.stringify(parsedFile) !== JSON.stringify(parsedData)) {
    throw new Error('Written JSON content does not exactly match extracted data');
  }
}

async function main() {
  const html = await readFile(inputPath, 'utf8');
  const counties = parseCounties(html);
  const { rawSelectCount, rawOptionCount } = verifyExtraction(html, counties);

  const jsonOutput = `${JSON.stringify(counties, null, 2)}\n`;
  await writeFile(outputPath, jsonOutput, 'utf8');

  const written = await readFile(outputPath, 'utf8');
  verifyWrittenOutput(written, counties);

  console.log(`Verified ${rawSelectCount} counties and ${rawOptionCount} areas.`);
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
