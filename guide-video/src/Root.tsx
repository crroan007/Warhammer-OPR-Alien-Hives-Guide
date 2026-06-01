import "./index.css";
import { Composition } from "remotion";
import { ArmyGuide, calculateMetadata } from "./ArmyGuide";
import { SCENES, FPS, WIDTH, HEIGHT } from "./scenes";

const DEFAULT_DURS = SCENES.map((s) => s.min);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ArmyGuide"
        component={ArmyGuide}
        durationInFrames={DEFAULT_DURS.reduce((a, b) => a + b, 0)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ durs: DEFAULT_DURS, hasAudio: SCENES.map(() => false) }}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
