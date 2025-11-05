"use client";

import { supabase } from "@/services/supabaseClient";
import Image from "next/image";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CandidatePhotoCapture from "@/components/CandidatePhotoCapture";

export default function JoinInterviewPage({ params }) {
  const { interview_id } = use(params);
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Info, 2: Photo, 3: Ready
  const [photoSaved, setPhotoSaved] = useState(false);

  useEffect(() => {
    async function fetchInterview() {
      setLoading(true);
      const { data, error } = await supabase
        .from("Interviews")
        .select("jobPosition, duration")
        .eq("interview_id", interview_id)
        .single();
      setInterview(data);
      setLoading(false);
    }
    fetchInterview();
  }, [interview_id]);

  useEffect(() => {
    // Stop all video streams when this page is loaded
    if (navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          stream.getTracks().forEach(track => track.stop());
        })
        .catch(() => {});
    }
  }, []);

  const handlePhotoSaved = (photoUrl) => {
    setPhotoSaved(true);
    setStep(3);
  };

  const goToStep2 = () => {
    if (name.trim() && email.trim()) {
      setStep(2);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <Image src="/logo1.png" alt="Recruit.AI Logo" width={120} height={40} />
          <div className="text-sm text-gray-500 mt-1">AI-Powered Interview Platform</div>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
              1
            </div>
            <div className={`w-12 h-1 ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
              2
            </div>
            <div className={`w-12 h-1 ${step >= 3 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
              3
            </div>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="flex flex-col items-center">
            <Image src="/ai-interview.jpg" alt="AI Interview" width={220} height={120} className="mb-4 rounded" />
            
            {/* Job Title and Duration */}
            {loading ? (
              <div className="h-8 w-32 bg-gray-200 animate-pulse rounded mb-2" />
            ) : interview ? (
              <>
                <div className="text-xl font-bold text-gray-900 mb-1">{interview.jobPosition}</div>
                <div className="flex items-center text-gray-500 text-sm mb-4">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path stroke="currentColor" strokeWidth="2" d="M12 6v6l4 2" />
                  </svg>
                  {interview.duration}
                </div>
              </>
            ) : (
              <div className="text-red-500 mb-4">Interview not found</div>
            )}

            {/* Name Input */}
            <input
              type="text"
              className="w-full max-w-md border rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter your full name"
              value={name}
              onChange={e => setName(e.target.value)}
            />

            {/* Email Input */}
            <input
              type="email"
              className="w-full max-w-md border rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />

            {/* Next Button */}
            <button
              className={`w-full max-w-md font-semibold py-3 rounded-lg transition ${!name.trim() || !email.trim() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
              disabled={!name.trim() || !email.trim()}
              onClick={goToStep2}
            >
              Next: Photo Verification →
            </button>
          </div>
        )}

        {/* Step 2: Photo Capture */}
        {step === 2 && (
          <div>
            <CandidatePhotoCapture
              interviewId={interview_id}
              candidateEmail={email}
              candidateName={name}
              onPhotoSaved={handlePhotoSaved}
            />
            <div className="mt-4 text-center">
              <button
                className="text-blue-500 hover:text-blue-700 underline"
                onClick={() => setStep(1)}
              >
                ← Back to Information
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Ready to Start */}
        {step === 3 && (
          <div className="text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">All Set!</h2>
              <p className="text-gray-600">Photo verified. You're ready to start your interview.</p>
            </div>

            {/* Interview Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-600">
                <div><strong>Name:</strong> {name}</div>
                <div><strong>Email:</strong> {email}</div>
                <div><strong>Position:</strong> {interview?.jobPosition}</div>
                <div><strong>Duration:</strong> {interview?.duration}</div>
              </div>
            </div>

            {/* Final Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6 text-sm text-blue-800">
              <div className="flex items-center mb-2">
                <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path stroke="currentColor" strokeWidth="2" d="M12 8v4h4" />
                </svg>
                <span className="font-semibold">Important Reminders</span>
              </div>
              <ul className="list-disc list-inside pl-2">
                <li>Ensure stable internet connection</li>
                <li>Stay focused and avoid tab switching</li>
                <li>Keep only yourself visible on camera</li>
                <li>No external materials or assistance</li>
              </ul>
            </div>

            {/* Start Interview Button */}
            <button
              className="w-full font-semibold py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white transition"
              onClick={() => {
                router.push(`/interview/${interview_id}/start?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`);
              }}
            >
              🚀 Start Interview
            </button>

            <div className="mt-4">
              <button
                className="text-blue-500 hover:text-blue-700 underline text-sm"
                onClick={() => setStep(2)}
              >
                ← Retake Photo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
