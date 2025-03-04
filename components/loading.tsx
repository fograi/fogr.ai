import { Card } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";

const Loading = () => {
  return (
    <div className="p-6">
      <div className="flex flex-wrap justify-center gap-4">
        {Array.from({ length: 32 }).map((_item, index) => (
          <Card
            key={index}
            className="flex-1 min-w-[150px] max-w-[200px] space-y-5 p-4"
            radius="lg"
          >
            <Skeleton className="rounded-lg">
              <div className="h-24 rounded-lg bg-default-300" />
            </Skeleton>
            <div className="space-y-3">
              <Skeleton className="w-3/5 rounded-lg">
                <div className="h-3 w-3/5 rounded-lg bg-default-200" />
              </Skeleton>
              <Skeleton className="w-4/5 rounded-lg">
                <div className="h-3 w-4/5 rounded-lg bg-default-200" />
              </Skeleton>
              <Skeleton className="w-2/5 rounded-lg">
                <div className="h-3 w-2/5 rounded-lg bg-default-300" />
              </Skeleton>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Loading;
