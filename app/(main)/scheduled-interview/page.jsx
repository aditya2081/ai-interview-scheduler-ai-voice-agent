"use client"

import React, { useState, useEffect } from 'react'
import { supabase } from "@/services/supabaseClient"
import { useUser } from '@/app/provider'
import { useRouter } from 'next/navigation'
import moment from 'moment'

function ScheduledInterview() {
    const { user } = useUser();
    const router = useRouter();
    const [interviewList, setInterviewList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        user && GetInterviewList();
    }, [user]);

    const GetInterviewList = async () => {
        if (!user?.email) return;
        
        setLoading(true);
        try {
            // Get all interviews for the user
            const { data: interviews, error: interviewError } = await supabase
                .from('Interviews')
                .select('*')
                .eq('userEmail', user.email)
                .order('created_at', { ascending: false });

            if (interviewError) {
                console.error('Error fetching interviews:', interviewError);
                return;
            }

            // For each interview, get actual attendance data from interview_sessions
            let interviewsWithFeedback = [];
            
            if (interviews && interviews.length > 0) {
                for (const interview of interviews) {
                    try {
                        // Get candidate count from interview-feedback table (actual attendees)
                        console.log("🔍 Checking candidates for interview:", interview.interview_id);
                        
                        const { data: feedbackData, error: feedbackError } = await supabase
                            .from('interview-feedback')  // Note: using hyphen, not underscore
                            .select('id')
                            .eq('interview_id', interview.interview_id);

                        let candidateCount = 0;
                        
                        if (!feedbackError && feedbackData) {
                            candidateCount = feedbackData.length;
                            console.log(`✅ Found ${candidateCount} completed interviews for ${interview.interview_id}`);
                        } else {
                            console.log('❌ No feedback data found for interview:', interview.interview_id, feedbackError?.message);
                            candidateCount = 0;
                        }

                        // Also get the actual feedback data for detailed view
                        const { data: fullFeedback, error: fullFeedbackError } = await supabase
                            .from('interview-feedback')  // Note: using hyphen, not underscore
                            .select('*')
                            .eq('interview_id', interview.interview_id);

                        interviewsWithFeedback.push({
                            ...interview,
                            candidateCount,
                            interview_feedback: fullFeedback || []
                        });

                    } catch (err) {
                        console.warn('Error processing interview data for:', interview.interview_id, err);
                        
                        interviewsWithFeedback.push({
                            ...interview,
                            candidateCount: 0, // Show 0 on error until tracking is working
                            interview_sessions: [],
                            interview_feedback: []
                        });
                    }
                }
            }

            console.log('Interviews with feedback:', interviewsWithFeedback);
            setInterviewList(interviewsWithFeedback || []);
        } catch (err) {
            console.error('Error in GetInterviewList:', err);
        } finally {
            setLoading(false);
        }
    }

    const InterviewFeedbackCard = ({ interview }) => {
        const candidateCount = interview.candidateCount || 0;
        
        const handleViewDetail = () => {
            router.push(`/scheduled-interview/${interview.interview_id}/details`);
        };
        
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {interview.jobPosition || 'Interview Position'}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {moment(interview.created_at).format('DD MMM YYYY')}
                            </span>
                        </div>
                        <div className="text-sm text-gray-500 mb-3">
                            {interview.duration || 'N/A'} Min
                        </div>
                        <div className="text-sm font-medium">
                            <span className={`${candidateCount > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                                {candidateCount} Candidate{candidateCount !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                    <div className="ml-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-lg">
                                {(interview.jobPosition || 'I').charAt(0).toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="border-t pt-4">
                    <button 
                        onClick={handleViewDetail}
                        className="w-full px-4 py-2 text-gray-700 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        View Detail
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="p-6">
                {/* Welcome Header Section */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Welcome Back, {user?.name || user?.email?.split('@')[0]?.toUpperCase() || 'User'}!
                            </h1>
                            <p className="text-gray-600">
                                AI-Driven interviews, Hassel-Free Hiring
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium text-lg">
                                {(user?.name || user?.email || 'S').charAt(0).toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">Interview List with Candidate Feedback</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, index) => (
                        <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-5 w-20 bg-gray-200 rounded-full mb-2"></div>
                                    <div className="h-4 w-12 bg-gray-200 rounded mb-3"></div>
                                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                </div>
                                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                            </div>
                            <div className="border-t pt-4">
                                <div className="h-10 bg-gray-200 rounded-md"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Welcome Header Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Welcome Back, {user?.name || user?.email?.split('@')[0]?.toUpperCase() || 'User'}!
                        </h1>
                        <p className="text-gray-600">
                            AI-Driven interviews, Hassel-Free Hiring
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-medium text-lg">
                            {(user?.name || user?.email || 'S').charAt(0).toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">Interview List with Candidate Feedback</h2>
            
            {interviewList.length === 0 ? (
                <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews with feedback found</h3>
                    <p className="text-gray-600 mb-6">Interviews with candidate feedback will appear here.</p>
                </div>
            ) : (
                <>
                    <div className="mb-4 text-sm text-gray-600">
                        Showing {interviewList.length} interview{interviewList.length !== 1 ? 's' : ''} with feedback
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {interviewList.map((interview, index) => (
                            <InterviewFeedbackCard key={interview.interview_id || index} interview={interview} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default ScheduledInterview;
