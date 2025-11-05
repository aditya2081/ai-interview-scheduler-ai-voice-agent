import React from 'react'
import { toast } from 'sonner'
import moment from 'moment'

export default function InterviewCard({ interview }) {
  const copyLink = () => {
    const url = process.env.NEXT_PUBLIC_HOST_URL + '/interview/' + interview?.interview_id
    navigator.clipboard.writeText(url);
    toast('Interview link copied to clipboard!')
  }

  const sendEmail = () => {
    const interviewUrl = process.env.NEXT_PUBLIC_HOST_URL + '/interview/' + interview?.interview_id;
    const subject = `Interview Invitation - ${interview?.jobPosition || 'Position'}`;
    const body = `Dear Candidate,

You are invited to participate in an AI-powered interview for the ${interview?.jobPosition || 'position'}.

Interview Details:
• Position: ${interview?.jobPosition || 'N/A'}
• Duration: ${interview?.duration || 'N/A'} minutes
• Interview Link: ${interviewUrl}

Please click on the link above to start your interview when you're ready.

Best regards,
The Interview Team`;

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {interview?.jobPosition || 'Interview Position'}
          </h3>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {moment(interview?.created_at).format('DD MMM YYYY')}
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {interview?.duration || 'N/A'} Min
          </div>
        </div>
        <div className="ml-4">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-lg">
              {(interview?.jobPosition || 'I').charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={copyLink}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy Link
        </button>
        <button
          onClick={sendEmail}
          className="flex-1 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 transform -rotate-45" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/>
          </svg>
          Send
        </button>
      </div>
    </div>
  )
}