"use client"
import React, { useState } from 'react'
import WelcomeContainer from '../_components/WelcomeContainer'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Progress } from '@/components/ui/progress';
import FormContainer from './_components/FormContainer'
import QuestionList from './_components/QuestionList'
import InterviewLink from './_components/InterviewLink'
import { toast } from 'sonner'

function CreateInterview() {
    const router=useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState();
    const [interviewData, setInterviewData] = useState();

    const onHandleInputChange = (field,value)=>{
        setFormData(prev=>({
            ...prev,
            [field]: value
        }))
        console.log('Form Data:', formData)

    }
    
    const handleBackClick = () => {
        router.push('/dashboard');
    };
    
    const onGoToNext = () => {
        if(!formData?.jobPosition||!formData?.jobDescription||!formData?.duration||!formData?.type)
        {
            toast('Please fill all required fields' )
            return ;
        }
        setStep(step+1);
    }

    const onInterviewFinish = (data) => {
        console.log('Interview finished with data:', data);
        setInterviewData(data);
        setStep(3); // Move to final step
    }

    const resetToStart = () => {
        setStep(1);
        setFormData({});
        setInterviewData(null);
    }
    return (
        <div>
            <div className='mt-1'>
                <WelcomeContainer/>
            </div>
            <div className='mt-1 px-10 md:px-24 lg:px-44 xl:px-56'>
                <div className='flex gap-5 items-center'> 
                    <ArrowLeft onClick={handleBackClick} className='cursor-pointer'/>
                    <h2 className='font-bold text-2xl'>Create New Interview</h2>
                </div>
                 <Progress value={step*33.33} className='my-6' />
                 {step==1 ? <FormContainer
                  onHandleInputChange={onHandleInputChange}
                  GoToNext={()=>onGoToNext()}
                 />
                 : step==2 && formData ? <QuestionList 
                    formData={formData} 
                    onFinish={onInterviewFinish}
                 /> 
                 : step==3 && interviewData ? <InterviewLink 
                    interviewData={interviewData} 
                    formData={formData}
                    onCreateNew={resetToStart}
                 /> 
                 : null}
            </div>
        </div>
    )
}

export default CreateInterview