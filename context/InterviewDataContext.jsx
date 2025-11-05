"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";

const InterviewDataContext = createContext();

export function InterviewDataProvider({ interviewId, children }) {
	const [interview, setInterview] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		async function fetchInterview() {
			setLoading(true);
			setError(null);
			const { data, error } = await supabase
				.from("Interviews")
				.select("jobPosition, duration, questionList")
				.eq("interview_id", interviewId)
				.single();
			if (error) setError(error);
			setInterview(data);
			setLoading(false);
		}
		if (interviewId) fetchInterview();
	}, [interviewId]);

	return (
		<InterviewDataContext.Provider value={{ interview, loading, error }}>
			{children}
		</InterviewDataContext.Provider>
	);
}

export function useInterviewData() {
	return useContext(InterviewDataContext);
}
