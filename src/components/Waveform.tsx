import { formatSecondsToHHMMSS, getRandomHex } from "@utils/utils";
import { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import { emptyAdSlot } from "@/data";
import type { AdDetectionResult } from "@/types";
import { DesignateGapModal } from "./DesignateGapModal";

type WaveformProps = {
  duration: number;
  amplitudes: number[];
  regionProps: { broadcast_id: number; data: AdDetectionResult[] };
  curDuration: { duration: number; source: string };
  setCurDuration: any;
  playingBroadcastId: number;
  filename: string;
};

export default function Waveform({ duration, amplitudes, regionProps, curDuration, setCurDuration, playingBroadcastId, filename }: WaveformProps) {
  const totalBars = amplitudes.length,
    secondsPerBar = duration / totalBars,
    barHeight = 75,
    barWidth = 2,
    apiUrl = import.meta.env["VITE_API_URL"];

  const [modal, setModal] = useState({ open: false, region: null });
  const [regions, setRegions] = useState<AdDetectionResult[]>([]);
  const [colors, setColors] = useState<Record<string | number, string>>({});
  const [src, setSrc] = useState("");

  const getRegionForIndex = (index: number): AdDetectionResult => {
    const time = Math.floor(index * secondsPerBar);
    const res = regions.find((r) => time >= r.start_time_seconds && time <= r.end_time_seconds);
    return res!;
  };

  const manipulateRegions = (regions: AdDetectionResult[]) => {
    // Sort regions by start time and round start and end times
    regions.sort((a, b) => a.start_time_seconds - b.start_time_seconds);
    const rs = [];
    let last_end_time = -1;
    for (const r of regions) {
      let start_time = Math.floor(r.start_time_seconds);
      if (start_time === last_end_time) {
        start_time += 1;
      }
      r.start_time_seconds = start_time;
      r.end_time_seconds = Math.floor(r.end_time_seconds);
      rs.push(r);
    }

    // Add empty time slot regions to regions
    const newRegions: AdDetectionResult[] = [];
    let lastAd: AdDetectionResult;
    last_end_time = -1;
    for (const r of rs) {
      if (r.start_time_seconds > last_end_time + 1) {
        const newRegion = { ...emptyAdSlot };
        newRegion.start_time_seconds = last_end_time + 1;
        newRegion.end_time_seconds = r.start_time_seconds - 1;
        newRegions.push(newRegion);
      }
      newRegions.push(r);
      lastAd = r;
      last_end_time = r.end_time_seconds;
    }

    // Add empty time slot between last ad
    // occurence and broadcast end, if exists
    if (lastAd!) {
      if (lastAd.end_time_seconds < duration - 1) {
        const newRegion = { ...emptyAdSlot };
        newRegion.start_time_seconds = lastAd.end_time_seconds + 1;
        newRegion.end_time_seconds = duration;
        newRegions.push(newRegion);
      }
    }
    return newRegions;
  };

  function handleSeek(time: number) {
    if (regionProps.broadcast_id === playingBroadcastId) setCurDuration({ duration: time, source: "waveform" });
  }

  function handleNewAd(region: AdDetectionResult) {
    console.log(region);
    setModal({ open: true, region });
  }

  async function fetchAudio() {
    try {
      const res = await fetch(`${apiUrl}/audio/broadcasts/${filename}`);
      if (!res.ok) throw new Error("Failed to fetch audio");

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      setSrc(audioUrl);
    } catch (e: any) {
      console.log(e);
    }
  }

  useEffect(() => {
    const newRegions = manipulateRegions(regionProps.data);
    setRegions(newRegions);
    const colorMap: Record<string | number, string> = {};
    for (const r of newRegions) {
      console.log(r.clip_type)
      if (r.clip_type === "empty") {
        colorMap[`${r.ad_id}-${r.clip_type}`] = "#222222";
      } else if (r.clip_type === "song") {
        colorMap[`${r.ad_id}-${r.clip_type}`] = getRandomHex("green");
      } else if (r.clip_type === "ad") {
        colorMap[`${r.ad_id}-${r.clip_type}`] = getRandomHex("orange");
      } else if (r.clip_type === "speech") {
        colorMap[`${r.ad_id}-${r.clip_type}`] = "#6784a8";
      }
    }
    setColors(colorMap);
  }, [regionProps]);

  useEffect(() => {
    fetchAudio();
  }, []);

  function handleModalClose() {
    setModal((prev) => ({ ...prev, open: false }));
  }

  if (!regions.length) {
    return <div>Loading Waveform...</div>;
  }

  return (
    <div className="p-4 rounded-lg">
      <div className="flex items-center relative">
        <div className="flex flex-col gap-4">
          <div className="flex relative">
            <div
              className={
                "bg-[#FFFFFF22] border-r-2 border-white absolute h-full left-0 w-12 pointer-events-none z-20 " +
                (regionProps.broadcast_id !== playingBroadcastId ? "hidden" : "")
              }
              style={{ width: `${(barWidth * curDuration.duration) / secondsPerBar}px` }}
            />

            {amplitudes.map((amp, index) => {
              const region = getRegionForIndex(index);
              const height = Math.max(amp * barHeight, 15);
              const tooltipId = `tooltip-${index}`;

              return (
                <div
                  key={index}
                  className={"h-full flex items-center relative " + (region.clip_type !== "empty" ? "" : "bg-neutral-200")}
                  style={{ height: `${barHeight * 1.2}px`, width: `${barWidth}px` }}
                  data-tooltip-id={tooltipId}
                  data-tooltip-content={
                    region ? `${region.brand}  |  ${formatSecondsToHHMMSS(region.start_time_seconds)} - ${formatSecondsToHHMMSS(region.end_time_seconds)}` : ""
                  }
                  onClick={() => handleSeek(index * secondsPerBar)}
                >
                  {region && <Tooltip id={tooltipId} place="top" className="z-50" />}
                  <div
                    className={`w-full rounded-full transition-all duration-300 relative`}
                    style={{ height: `${height}px`, backgroundColor: colors[`${region.ad_id}-${region.clip_type}`] }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex">
            {regions.map((r) => {
              const mid = r.start_time_seconds + (r.end_time_seconds - r.start_time_seconds) / 2;
              if (r.clip_type !== "empty") {
                return null;
              }
              return (
                <div
                  className="absolute bottom-8 h-2 w-2 rounded-full bg-black cursor-pointer"
                  style={{ left: `${(mid / secondsPerBar) * barWidth}px`, boxShadow: "0px 0px 2px 1px white" }}
                  onClick={() => handleNewAd(r)}
                />
              );
            })}
          </div>
          <div className="flex text-neutral-400 gap-4 items-center justify-end pr-4">
            <div className="flex gap-2 items-center">
              <div className="h-3 w-3 rounded-full bg-orange-400" />
              <p>Ads</p>
            </div>
            <div className="flex gap-2 items-center">
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <p>Songs</p>
            </div>
            <div className="flex gap-2 items-center">
              <div className="h-3 w-3 rounded-full bg-[#6784a8]" />
              <p>Speech</p>
            </div>
          </div>
        </div>
      </div>
      {modal.region && (
        <DesignateGapModal onClose={handleModalClose} region={modal.region} src={src} isOpen={modal.open} broadcastId={regionProps.broadcast_id} />
      )}
    </div>
  );
}
