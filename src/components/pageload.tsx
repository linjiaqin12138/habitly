import { Loader2 } from "lucide-react";

export default function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">加载中...</span>
    </div>
  );
}