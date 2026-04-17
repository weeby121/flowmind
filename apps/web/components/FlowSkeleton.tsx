export default function FlowSkeleton() {
  return (
    <div className="w-full h-[600px] bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center border-2 border-slate-200">
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-slate-200 rounded-full" />
          <div className="w-32 h-12 bg-slate-200 rounded-lg" />
        </div>
        <p className="text-slate-400 font-medium animate-bounce">Flowww is mapping your mind...</p>
      </div>
    </div>
  );
}