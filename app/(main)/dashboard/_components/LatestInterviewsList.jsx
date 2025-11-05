"use client"
import React, { useState, useEffect } from 'react'
import NextLink from 'next/link'
import { Video, Copy, Send, Link } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/services/supabaseClient'
import { useUser } from '@/app/provider'
import moment from 'moment'
import { toast } from 'sonner'

function LatestInterviewsList() {
    const [interviewList, setInterviewList] = useState([]);
    const { user } = useUser();

    const GetInterviewList = async () => {
        if (!user?.email) return;
        
        try {
            let { data: Interviews, error } = await supabase
                .from('Interviews')
                .select('*')
                .eq('userEmail', user.email)
                .order('created_at', { ascending: false })
                .limit(6);

            if (error) {
                console.error('Error fetching interviews:', error);
                return;
            }

            console.log('Interviews:', Interviews);
            setInterviewList(Interviews || []);
        } catch (err) {
            console.error('Error in GetInterviewList:', err);
        }
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Link copied to clipboard!');
    }

    const sendEmail = (interviewId) => {
        const interviewLink = `${process.env.NEXT_PUBLIC_HOST_URL || 'http://localhost:3000'}/interview/${interviewId}`;
        const subject = encodeURIComponent('Interview Invitation');
        const body = encodeURIComponent(`You have been invited to participate in an interview. Please click on the link below to join:\n\n${interviewLink}\n\nBest regards,\nAIcruiter Team`);
        const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
        
        window.open(mailtoLink, '_blank');
        toast.success('Email client opened with interview link!');
    }

    useEffect(() => {
        if (user) {
            GetInterviewList();
        }
    }, [user]);

    return (
        <div className='my-5'>
            <h2 className='font-bold text-2xl mb-5'>Previously Created Interviews</h2>
            {interviewList?.length === 0 &&
                <div className='p-5 flex flex-col gap-3 items-center justify-center mt-5' >
                    <Video className='h-10 w-10 text-primary' />
                    <h2>You don't have any interview created!</h2>
                    <Button asChild>
                        <NextLink href="/dashboard/create-interview">+Create New Interview</NextLink>
                    </Button>
                </div>
            }
            {interviewList && interviewList.length > 0 &&
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {interviewList.map((interview, index) => (
                        <InterviewCard 
                            interview={interview} 
                            key={interview.interview_id || index} 
                            onCopyLink={copyToClipboard}
                            onSendEmail={sendEmail}
                        />
                    ))}
                </div>
            }
        </div>
    )
}

// InterviewCard component matching the UI design
function InterviewCard({ interview, onCopyLink, onSendEmail }) {
    const interviewLink = `${process.env.NEXT_PUBLIC_HOST_URL || 'http://localhost:3000'}/interview/${interview.interview_id}`;
    
    return (
        <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            {/* Date Badge */}
            <div className="flex justify-between items-start mb-3">
                <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {moment(interview.created_at).format('DD MMM YYYY')}
                </div>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
            </div>
            
            {/* Job Position */}
            <h3 className="font-bold text-lg text-gray-800 mb-1">
                {interview.jobPosition || 'Interview Position'}
            </h3>
            
            {/* Duration */}
            <p className="text-gray-600 text-sm mb-4">
                {interview.duration || 'N/A'} Min
            </p>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center gap-2"
                    onClick={() => onCopyLink(interviewLink)}
                >
                    <Copy className="w-4 h-4" />
                    Copy Link
                </Button>
                <Button
                    size="sm"
                    className="flex-1 flex items-center gap-2 bg-blue-500 hover:bg-blue-600"
                    onClick={() => onSendEmail(interview.interview_id)}
                >
                    <Send className="w-4 h-4" />
                    Send
                </Button>
            </div>
        </div>
    );
}

export default LatestInterviewsList