import "./index.css";
import { Composition } from "remotion";
import { ArmyGuide, TOTAL_FRAMES, FPS, WIDTH, HEIGHT } from "./ArmyGuide";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ArmyGuide"
        component={ArmyGuide}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
