import React, { useEffect, useState, useRef, useCallback } from "react";

// duration: string like "45 Minutes" or number (minutes)
export default function TimerComponent({ active, duration, onComplete, interviewEnded }) {
	// Parse duration to minutes
	let mins = 0;
	if (typeof duration === "string") {
		const match = duration.match(/(\d+)/);
		mins = match ? parseInt(match[1], 10) : 0;
	} else if (typeof duration === "number") {
		mins = duration;
	}
	const totalSeconds = mins * 60;

	const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
	const intervalRef = useRef();
	const onCompleteRef = useRef(onComplete);

	// Update the callback ref when onComplete changes
	useEffect(() => {
		onCompleteRef.current = onComplete;
	}, [onComplete]);

	// Memoized completion handler to prevent unnecessary re-renders
	const handleComplete = useCallback(() => {
		if (onCompleteRef.current) {
			// Use setTimeout to avoid calling setState during render
			setTimeout(() => {
				onCompleteRef.current();
			}, 0);
		}
	}, []);

	// Start/stop timer
	useEffect(() => {
		if (active && !interviewEnded) {
			setSecondsLeft(totalSeconds);
			intervalRef.current = setInterval(() => {
				setSecondsLeft(prev => {
					if (prev <= 1) {
						clearInterval(intervalRef.current);
						handleComplete();
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		} else {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		}
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [active, interviewEnded, totalSeconds, handleComplete]);

	// Format as HH:MM:SS
	const format = (s) => {
		const h = Math.floor(s / 3600);
		const m = Math.floor((s % 3600) / 60);
		const sec = s % 60;
		return [h, m, sec]
			.map(v => v.toString().padStart(2, "0"))
			.join(":");
	};

	return (
		<div className="font-mono text-2xl text-blue-700">
			{format(secondsLeft)}
		</div>
	);
}
