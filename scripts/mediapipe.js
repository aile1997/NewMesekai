import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import {
  Holistic,
  POSE_CONNECTIONS,
  FACEMESH_TESSELATION,
  HAND_CONNECTIONS,
} from "@mediapipe/holistic";

import { setPose, setFingers, setMorphs } from "./avatar";

// device constants
const WIDTH = 640;
const HEIGHT = 480;

export function PoseDetector(preload, videoInput, canvasInput) {
  const holistic = new Holistic({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
    },
  });

  holistic.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    refineFaceLandmarks: true,
  });

  holistic.onResults((results) => {
    preload.hidden = true;

    let poseLandmarks = results.poseLandmarks;
    let poseWorldLandmarks = results.ea;
    if (poseWorldLandmarks) {
      setPose(poseLandmarks, poseWorldLandmarks);
    }

    let leftHandLandmarks = results.leftHandLandmarks;
    if (leftHandLandmarks) {
      setFingers(leftHandLandmarks, false);
    }

    let rightHandLandmarks = results.rightHandLandmarks;
    if (rightHandLandmarks) {
      setFingers(rightHandLandmarks, true);
    }

    let faceLandmarks = results.faceLandmarks;
    if (faceLandmarks) {
      setMorphs(faceLandmarks);
      drawResults(results);
    }
  });

  const drawResults = (results) => {
    canvasInput.width = videoInput.videoWidth;
    canvasInput.height = videoInput.videoHeight;
    let canvasCtx = canvasInput.getContext("2d");
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasInput.width, canvasInput.height);
    // Use `Mediapipe` drawing functions
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
      color: "#00cff7",
      lineWidth: 4,
    });
    drawLandmarks(canvasCtx, results.poseLandmarks, {
      color: "#ff0364",
      lineWidth: 2,
    });
    drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION, {
      color: "#C0C0C070",
      lineWidth: 1,
    });
    if (results.faceLandmarks && results.faceLandmarks.length === 478) {
      //draw pupils
      drawLandmarks(
        canvasCtx,
        [results.faceLandmarks[468], results.faceLandmarks[468 + 5]],
        {
          color: "#ffe603",
          lineWidth: 2,
        }
      );
    }
    drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, {
      color: "#eb1064",
      lineWidth: 5,
    });
    drawLandmarks(canvasCtx, results.leftHandLandmarks, {
      color: "#00cff7",
      lineWidth: 2,
    });
    drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, {
      color: "#22c3e3",
      lineWidth: 5,
    });
    drawLandmarks(canvasCtx, results.rightHandLandmarks, {
      color: "#ff0364",
      lineWidth: 2,
    });
  };
  const camera = new Camera(videoInput, {
    onFrame: async () => {
      await holistic.send({ image: videoInput });
    },
    width: WIDTH,
    height: HEIGHT,
  });

  return [holistic, camera];
}
