"use client"
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Copy, Clock, FileText, ArrowLeft, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

function InterviewLink({ interviewData, formData, onCreateNew }) {
    const router = useRouter()
    const [interviewLink, setInterviewLink] = useState('')
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        // Generate the interview link
        if (interviewData?.interview_id || interviewData?.id) {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
            const interviewId = interviewData.interview_id || interviewData.id
            const link = `${baseUrl}/interview/${interviewId}`
            setInterviewLink(link)
        }
    }, [interviewData])

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(interviewLink)
            setCopied(true)
            toast.success('Interview link copied to clipboard!')
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error('Failed to copy link:', error)
            toast.error('Failed to copy link')
        }
    }

    const handleShareSlack = () => {
        const message = `AI Interview is ready! Join here: ${interviewLink}`
        const slackUrl = `https://slack.com/intl/en-in/help/articles/201330736-Add-links-to-messages`
        // For a real implementation, you'd use Slack's Web API or deep linking
        navigator.clipboard.writeText(message)
        toast.success('Message copied! Paste it in Slack')
    }

    const handleShareEmail = () => {
        const subject = encodeURIComponent('AI Interview Invitation - Ready to Start!')
        const body = encodeURIComponent(`Hello,

Your AI Interview is ready! 

Interview Details:
• Position: ${formData?.jobPosition || 'Not specified'}
• Duration: ${formData?.duration || '30'} minutes
• Questions: ${interviewData?.questions?.length || 10} questions
• Valid for: 30 Days

Interview Link: ${interviewLink}

Please click the link above to start your interview process.

Best regards!`)
        
        const mailtoUrl = `mailto:?subject=${subject}&body=${body}`
        window.open(mailtoUrl, '_blank')
    }

    const handleShareWhatsApp = () => {
        const message = encodeURIComponent(`🎯 *AI Interview is Ready!*

*Position:* ${formData?.jobPosition || 'Not specified'}
*Duration:* ${formData?.duration || '30'} minutes  
*Questions:* ${interviewData?.questions?.length || 10} questions

*Interview Link:* ${interviewLink}

Valid for 30 days. Click the link to start! 🚀`)
        
        const whatsappUrl = `https://wa.me/?text=${message}`
        window.open(whatsappUrl, '_blank')
    }

    const handleBackToDashboard = () => {
        router.push('/dashboard')
    }

    const handleCreateNewInterview = () => {
        if (onCreateNew) {
            onCreateNew(); // Reset the form state
        } else {
            // Fallback: navigate to dashboard and back
            router.push('/dashboard')
            setTimeout(() => {
                router.push('/dashboard/create-interview')
            }, 100)
        }
    }

    const getValidUntilDate = () => {
        const date = new Date()
        date.setDate(date.getDate() + 30)
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })
    }

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white">
            {/* Success Header */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Your AI Interview is Ready!
                </h1>
                <p className="text-gray-600">
                    Share this link with your candidates to start the interview process
                </p>
            </div>

            {/* Interview Link Section */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Interview Link</h3>
                    <span className="text-sm text-green-600 font-medium">
                        Valid for 30 Days
                    </span>
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 bg-white border rounded-lg p-3 text-sm text-gray-700 break-all">
                        {interviewLink || 'Generating link...'}
                    </div>
                    <Button 
                        onClick={handleCopyLink}
                        disabled={!interviewLink}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                        <Copy className="w-4 h-4" />
                        {copied ? 'Copied!' : 'Copy Link'}
                    </Button>
                </div>

                {/* Interview Details */}
                <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formData?.duration || '30'} Min</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>{interviewData?.questions?.length || 10} Questions</span>
                    </div>
                </div>
            </div>

            {/* Share Options */}
            <div className="mb-8">
                <h3 className="font-semibold text-lg mb-4">Share Via</h3>
                <div className="grid grid-cols-3 gap-4">
                    <Button
                        variant="outline"
                        onClick={handleShareSlack}
                        className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-purple-50 border-purple-200"
                    >
                        <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                            </svg>
                        </div>
                        <span>Slack</span>
                    </Button>
                    
                    <Button
                        variant="outline"
                        onClick={handleShareEmail}
                        className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-red-50 border-red-200"
                    >
                        <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-.904.732-1.636 1.636-1.636h3.819v.273L12 10.366l6.545-6.272v-.273h3.819c.904 0 1.636.732 1.636 1.636Z"/>
                            </svg>
                        </div>
                        <span>Gmail</span>
                    </Button>
                    
                    <Button
                        variant="outline"
                        onClick={handleShareWhatsApp}
                        className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-green-50 border-green-200"
                    >
                        <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.484 3.488"/>
                            </svg>
                        </div>
                        <span>WhatsApp</span>
                    </Button>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
                <Button
                    variant="outline"
                    onClick={handleBackToDashboard}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Button>
                
                <Button
                    onClick={handleCreateNewInterview}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Create New Interview
                </Button>
            </div>

            {/* Additional Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Interview Details:</h4>
                <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Position:</strong> {formData?.jobPosition || 'Not specified'}</p>
                    <p><strong>Type:</strong> {Array.isArray(formData?.type) ? formData.type.join(', ') : (formData?.type || 'General')}</p>
                    <p><strong>Duration:</strong> {formData?.duration || '30'} minutes</p>
                    <p><strong>Total Questions:</strong> {interviewData?.questions?.length || 10}</p>
                    <p><strong>Valid Until:</strong> {getValidUntilDate()}</p>
                </div>
            </div>
        </div>
    )
}

export default InterviewLink
