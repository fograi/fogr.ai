"use client";

import Masonry from "react-masonry-css";

import ClassifiedCard from "./card";

import { mockClassifieds } from "@/lib/mockData";

const ClassifiedMasonryGrid = () => {
  const breakpointColumnsObj = {
    default: 3,
    7680: 12,
    5120: 10,
    3840: 8,
    2560: 6,
    1920: 5,
    1440: 4,
    1100: 3,
    700: 2,
    500: 1,
  };

  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="my-masonry-grid p-6"
      columnClassName="my-masonry-grid_column"
    >
      {mockClassifieds.map((classified) => (
        <ClassifiedCard {...classified} key={classified.id} />
      ))}
    </Masonry>
  );
};

export default ClassifiedMasonryGrid;
