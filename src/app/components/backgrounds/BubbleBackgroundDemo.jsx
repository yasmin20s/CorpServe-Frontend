import { BubbleBackground } from './bubble';

export function BubbleBackgroundDemo({ interactive }) {
  return (
    <BubbleBackground
      interactive={interactive}
      className="absolute inset-0 flex items-center justify-center"
    />
  );
}
