import { useRef, useState } from "react";
import { FaMusic, FaXmark } from "react-icons/fa6";
import { getLastSegment } from "@utils/utils";

export default function UploadBroadcastModal({ isOpen, onClose, startUpload }) {
  const apiUrl = import.meta.env["VITE_API_URL"];
  const [radioStation, setRadioStation] = useState("");
  const [recordingName, setRecordingName] = useState("");
  const [file, setFile] = useState<File | null>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stationTextareaRef = useRef(null)
  const recordingTextareaRef = useRef(null)

  const onTextareaResize = (key: "station" | "recording") => {
    let el: HTMLTextAreaElement;
    if(key == "station"){
      el = stationTextareaRef.current;
    } else {
      el = recordingTextareaRef.current;
    }
    if(!el) return;
    const lineHeight = parseInt(getComputedStyle(el).lineHeight || "15", 10);
    const maxLines = 5;
    const maxHeight = lineHeight * maxLines;

    el.style.height = "auto";
    const newHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${newHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) return alert("Please select an audio file");
    if (!radioStation || !recordingName) {
      return alert("Please fill in all required fields");
    }

    try {
      // Get audio duration using HTMLAudioElement
      const getDuration = (file) => {
        return new Promise((resolve, reject) => {
          const audio = document.createElement("audio");
          audio.preload = "metadata";
          audio.onloadedmetadata = () => {
            resolve(Math.floor(audio.duration)); // round down to seconds
          };
          audio.onerror = reject;
          audio.src = URL.createObjectURL(file);
        });
      };

      const duration = await getDuration(file);
      onClose();
      startUpload(file, duration, radioStation, recordingName)
    } catch (err) {
      console.error(err);
      alert("Upload failed. See console for details.");
    } finally {
      setRadioStation("");
      setRecordingName("");
      setFile(null)
      fileInputRef.current.value = ''
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#000000AA] flex items-center justify-center z-[100]" onClick={onClose}>
      <div className="bg-black text-white px-8 py-5 rounded-lg max-w-md w-full relative modal-shadow" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-4 right-4 cursor-pointer" onClick={onClose}>
          <FaXmark />
        </button>
        <h2 className="text-xl font-bold">Upload New Broadcast</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 !mt-4">
          <div className="flex flex-col gap-2">
            <label>Radio Station</label>
            <textarea
              value={radioStation}
              onChange={(e) => {
                setRadioStation(e.target.value)
                onTextareaResize("station")
              }}
              ref={stationTextareaRef}
              required
              className="pt-2 rounded-md resize-none bg-neutral-800 focus:outline-none px-4"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label>Recording name</label>
            <textarea
              value={recordingName}
              onChange={(e) => {
                setRecordingName(e.target.value)
                onTextareaResize("recording")
              }}
              required
              ref={recordingTextareaRef}
              className="pt-2 rounded-md resize-none bg-neutral-800 focus:outline-none px-4"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label>Audio File:</label>
            <input type="file" accept="audio/*" ref={fileInputRef} onChange={(e) => setFile(e.target.files![0])} required className="hidden" />
            <button
              type="button"
              className="rounded-md h-10 !mb-1 bg-neutral-800 focus:outline-none self-start px-4"
              onClick={() => fileInputRef.current!.click()}
            >
              Choose File
            </button>
            {file && (
              <div className="flex gap-4 overflow-hidden items-center">
                <FaMusic size={14} className="shrink-0 text-neutral-600" />
                <p className="text-sm truncate grow break-all line-clamp-1">{file.name}</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="h-10 bg-orange-400 text-black rounded-md self-end px-4 flex items-center justify-center disabled:bg-orange-200 disabled:cursor-default cursor-pointer"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
