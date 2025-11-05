import React, { useState } from 'react'
import moment from 'moment'
import FeedbackModal from './FeedbackModal'

function CandidateList({ candidates, interviewId }) {
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const handleViewReport = (candidate) => {
        setSelectedCandidate(candidate);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedCandidate(null);
    };

    const calculateScore = (feedback) => {
        if (!feedback) return 'N/A';
        
        try {
            // If feedback is a JSON object with rating scores
            if (typeof feedback === 'object' && feedback.rating) {
                const ratings = feedback.rating;
                if (typeof ratings === 'object') {
                    // Calculate average from all rating scores
                    const scores = Object.values(ratings).filter(score => typeof score === 'number' && score > 0);
                    if (scores.length > 0) {
                        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
                        return Math.round(average * 10) / 10; // Round to 1 decimal place
                    }
                }
            }
            
            // Check for direct rating field
            if (typeof feedback === 'object' && typeof feedback.overall_rating === 'number') {
                return feedback.overall_rating;
            }
            
            // Fallback: try to extract any numeric value
            if (typeof feedback === 'object') {
                const possibleRating = feedback.score || feedback.rating || feedback.grade;
                if (typeof possibleRating === 'number') {
                    return possibleRating;
                }
            }
            
            return 'N/A';
        } catch (error) {
            console.error('Error calculating score:', error);
            return 'N/A';
        }
    };

    const getRecommendation = (feedback) => {
        if (!feedback || typeof feedback !== 'object') return null;
        
        return feedback.Recommendation || feedback.recommendation || null;
    };

    const getRecommendationColor = (recommendation) => {
        if (!recommendation) return 'text-gray-500';
        
        const rec = recommendation.toLowerCase();
        if (rec.includes('hire') && !rec.includes('not')) return 'text-green-600';
        if (rec.includes('not') || rec.includes('reject')) return 'text-red-600';
        return 'text-yellow-600'; // For "Further Review" etc.
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                    Candidates ({candidates.length})
                </h2>
            </div>

            {candidates.length === 0 ? (
                <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates yet</h3>
                    <p className="text-gray-600 mb-4">
                        Candidates who complete this interview will appear here.
                    </p>
                    <div className="text-sm text-gray-500">
                        Share this interview: {process.env.NEXT_PUBLIC_HOST_URL}/interview/{interviewId}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {candidates.map((candidate, index) => {
                        const score = calculateScore(candidate.feedback);
                        const recommendation = getRecommendation(candidate.feedback);
                        const candidateName = candidate.userName || candidate.candidate_name || `Candidate ${index + 1}`;
                        const candidateEmail = candidate.userEmail || 'No email provided';
                        
                        return (
                            <div key={candidate.id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        {/* Candidate Avatar */}
                                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                            <span className="text-white font-medium text-lg">
                                                {candidateName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        
                                        {/* Candidate Info */}
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 text-lg">
                                                {candidateName}
                                            </h4>
                                            <p className="text-sm text-gray-600 mb-1">
                                                {candidateEmail}
                                            </p>
                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                <span>
                                                    📅 Completed: {moment(candidate.created_at).format('MMM DD, YYYY')}
                                                </span>
                                                <span>
                                                    📸 Photo: {candidate.photo_status === 'completed' ? '✅ Captured' : '⏳ Pending'}
                                                </span>
                                                <span>
                                                    🕒 {moment(candidate.created_at).format('h:mm A')}
                                                </span>
                                            </div>
                                            {recommendation && (
                                                <div className="mt-2">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        recommendation.toLowerCase().includes('hire') && !recommendation.toLowerCase().includes('not')
                                                            ? 'bg-green-100 text-green-800'
                                                            : recommendation.toLowerCase().includes('not') || recommendation.toLowerCase().includes('reject')
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {recommendation}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-6">
                                        {/* Score */}
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-gray-900 mb-1">
                                                {score !== 'N/A' ? `${score}/10` : 'N/A'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Overall Score
                                            </div>
                                        </div>
                                        
                                        {/* View Report Button */}
                                        <button
                                            onClick={() => handleViewReport(candidate)}
                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                                        >
                                            <span>View Report</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            
            {/* Feedback Modal */}
            <FeedbackModal 
                candidate={selectedCandidate}
                isOpen={isModalOpen}
                onClose={closeModal}
            />
        </div>
    );
}

export default CandidateList;
