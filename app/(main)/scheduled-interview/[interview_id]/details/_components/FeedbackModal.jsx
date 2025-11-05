'use client'
import React, { useState } from 'react'
import moment from 'moment'
import VideoPlayer from '@/components/VideoPlayer'

function FeedbackModal({ candidate, isOpen, onClose }) {
    const [recommendationMessage, setRecommendationMessage] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    if (!isOpen || !candidate) return null;

    const feedback = candidate.feedback || {};
    const ratings = feedback.rating || {};
    const candidateName = candidate.userName || candidate.candidate_name || 'Candidate';
    const candidateEmail = candidate.userEmail || 'No email provided';
    const videoUrl = candidate.video_url || null;
    const videoDuration = candidate.video_duration || null;

    // Calculate overall score
    const calculateOverallScore = () => {
        const scores = Object.values(ratings).filter(score => typeof score === 'number' && score > 0);
        if (scores.length > 0) {
            const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            return Math.round(average * 10) / 10;
        }
        return 0;
    };

    const overallScore = calculateOverallScore();

    // Skills data with their scores
    const skills = [
        {
            name: 'Technical Skills',
            score: ratings.technicalSkills || 0,
            maxScore: 10
        },
        {
            name: 'Communication',
            score: ratings.communication || 0,
            maxScore: 10
        },
        {
            name: 'Problem Solving',
            score: ratings.problemSolving || 0,
            maxScore: 10
        },
        {
            name: 'Experience',
            score: ratings.experience || 0,
            maxScore: 10
        }
    ];

    const getRecommendation = () => {
        return feedback.Recommendation || feedback.recommendation || 'Not Available';
    };

    const getRecommendationMessage = () => {
        return feedback.RecommendationMsg || feedback.recommendationMessage || 'No recommendation message available.';
    };

    const getRecommendationColor = (recommendation) => {
        const rec = recommendation.toLowerCase();
        if (rec.includes('hire') && !rec.includes('not')) return 'bg-green-50 border-green-200 text-green-800';
        if (rec.includes('not') || rec.includes('reject')) return 'bg-red-50 border-red-200 text-red-800';
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    };

    const sendMessage = async () => {
        if (!recommendationMessage.trim()) {
            alert('Please enter a recommendation message before sending.');
            return;
        }

        if (!candidateEmail || candidateEmail === 'No email provided') {
            alert('No valid email address found for this candidate.');
            return;
        }

        setIsSendingEmail(true);
        
        try {
            const emailData = {
                to: candidateEmail,
                candidateName: candidateName,
                feedback: feedback,
                recommendationMessage: recommendationMessage.trim(),
                interviewDate: moment(candidate.created_at).format('MMMM DD, YYYY'),
                scores: {
                    overall: overallScore,
                    technical: ratings.technicalSkills || 0,
                    communication: ratings.communication || 0,
                    problemSolving: ratings.problemSolving || 0,
                    experience: ratings.experience || 0
                }
            };

            const response = await fetch('/api/send-feedback-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailData)
            });

            const result = await response.json();

            if (result.success) {
                setEmailSent(true);
                alert('✅ Feedback email sent successfully to ' + candidateEmail);
                setRecommendationMessage(''); // Clear the message
            } else {
                throw new Error(result.error || 'Failed to send email');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            alert('❌ Failed to send email: ' + error.message);
        } finally {
            setIsSendingEmail(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Feedback</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {/* Candidate Info Section */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            {/* Candidate Avatar */}
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium text-lg">
                                    {candidateName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{candidateName}</h3>
                                <p className="text-sm text-gray-600">{candidateEmail}</p>
                            </div>
                        </div>
                        
                        {/* Overall Score */}
                        <div className="text-right">
                            <div className="text-3xl font-bold text-blue-600">
                                {overallScore}/10
                            </div>
                        </div>
                    </div>

                    {/* Interview Video Section */}
                    {videoUrl && (
                        <div className="mb-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-3">Interview Recording</h4>
                            <VideoPlayer 
                                videoUrl={videoUrl}
                                candidateName={candidateName}
                                duration={videoDuration}
                            />
                        </div>
                    )}

                    {/* Skills Assessment Section */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Skills Assessment</h4>
                        <div className="grid grid-cols-2 gap-6">
                            {skills.map((skill, index) => (
                                <div key={index}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">{skill.name}</span>
                                        <span className="text-sm text-gray-600">{skill.score}/{skill.maxScore}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(skill.score / skill.maxScore) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Performance Summary Section */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Performance Summary</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-700 leading-relaxed">
                                {feedback.summary || 'No performance summary available for this candidate.'}
                            </p>
                        </div>
                    </div>

                    {/* Interview Integrity Section */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Interview Integrity Report</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                            {/* Interview Completion */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Interview Completion</span>
                                    <span className="text-sm text-gray-600">
                                        {feedback.interviewCompletion ? `${feedback.interviewCompletion.toFixed(1)}%` : 'Unknown'}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            (feedback.interviewCompletion || 0) >= 80 ? 'bg-green-600' :
                                            (feedback.interviewCompletion || 0) >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                                        }`}
                                        style={{ width: `${feedback.interviewCompletion || 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Malpractice Detection */}
                            <div className="border-t border-gray-200 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-medium text-gray-700">Integrity Status</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        feedback.malpracticeDetected ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                        {feedback.malpracticeDetected ? 'Issues Detected' : 'No Issues'}
                                    </span>
                                </div>
                                
                                {feedback.malpracticeDetails && (
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Tab Switches:</span>
                                            <span className={`font-medium ${
                                                feedback.malpracticeDetails.tabSwitches > 0 ? 'text-red-600' : 'text-green-600'
                                            }`}>
                                                {feedback.malpracticeDetails.tabSwitches || 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Object Detections:</span>
                                            <span className={`font-medium ${
                                                feedback.malpracticeDetails.objectDetections > 0 ? 'text-red-600' : 'text-green-600'
                                            }`}>
                                                {feedback.malpracticeDetails.objectDetections || 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between col-span-2">
                                            <span className="text-gray-600">Integrity Score:</span>
                                            <span className={`font-medium ${
                                                (feedback.malpracticeDetails.integrityScore || 10) >= 8 ? 'text-green-600' :
                                                (feedback.malpracticeDetails.integrityScore || 10) >= 6 ? 'text-yellow-600' : 'text-red-600'
                                            }`}>
                                                {(feedback.malpracticeDetails.integrityScore || 10).toFixed(1)}/10
                                            </span>
                                        </div>
                                    </div>
                                )}
                                
                                {feedback.malpracticeDetected && (
                                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                                        <p className="text-sm text-red-700">
                                            ⚠️ Potential integrity concerns detected during the interview. 
                                            Please review the video recording and consider additional evaluation.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recommendation Section */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Recommendation</h4>
                        <div className={`rounded-lg p-4 border ${getRecommendationColor(getRecommendation())}`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-medium">System Recommendation:</span>
                                <span className="text-sm text-gray-600">{getRecommendation()}</span>
                            </div>
                            <p className="text-sm leading-relaxed mb-4">
                                {getRecommendationMessage()}
                            </p>
                            
                            {/* Custom Recommendation Message Input */}
                            <div className="border-t border-gray-200 pt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="font-medium text-gray-700">
                                        Custom Recommendation Message:
                                    </label>
                                    <button
                                        onClick={sendMessage}
                                        disabled={isSendingEmail || !recommendationMessage.trim()}
                                        className={`px-4 py-1 rounded text-sm transition-colors ${
                                            isSendingEmail || !recommendationMessage.trim()
                                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                : 'bg-red-600 text-white hover:bg-red-700'
                                        }`}
                                    >
                                        {isSendingEmail ? 'Sending...' : 'Send Msg'}
                                    </button>
                                </div>
                                <textarea
                                    value={recommendationMessage}
                                    onChange={(e) => setRecommendationMessage(e.target.value)}
                                    placeholder="Enter your personalized recommendation message for the candidate..."
                                    className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows="3"
                                />
                                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                                    <span>This message will be sent to: {candidateEmail}</span>
                                    <span>{recommendationMessage.length}/500</span>
                                </div>
                                {emailSent && (
                                    <div className="mt-2 p-2 bg-green-100 border border-green-200 rounded text-sm text-green-700">
                                        ✅ Email sent successfully!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Interview Details */}
                    <div className="text-sm text-gray-500 border-t border-gray-200 pt-4">
                        <p>Interview completed on {moment(candidate.created_at).format('MMMM DD, YYYY')} at {moment(candidate.created_at).format('h:mm A')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FeedbackModal;