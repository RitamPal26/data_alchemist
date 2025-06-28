'use client';
import { useStore } from '@/lib/store';

export default function Priorities() {
  const weights = useStore((s) => s.weights);
  const setWeights = useStore((s) => s.setWeights);

  const handle = (k: string, v: number) =>
    setWeights({ ...weights, [k]: v });

  return (
    <div className="grid gap-4 my-4">
      {['priorityLevel', 'fairness', 'cost'].map((k) => (
        <label key={k} className="flex gap-2 items-center">
          {k}
          <input
            type="range"
            min={0}
            max={10}
            value={weights[k] ?? 5}
            onChange={(e) => handle(k, Number(e.target.value))}
          />
          <span>{weights[k] ?? 5}</span>
        </label>
      ))}
    </div>
  );
}
