import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { InterviewType } from '@/services/Constants'

function FormContainer({onHandleInputChange,GoToNext}) {
    const [interviewType, setInterviewType] =useState([]);

    useEffect(() => {
        if(interviewType)
        {
            onHandleInputChange('type', interviewType)
        }
        }, [interviewType])
    return (
        <div className='p-5 bg-white rounded-xl'>
            <div>
                <h2 className='text-sm font-medium'>Job Position</h2>
                <Input placeholder='eg.FSD'
                 className='mt-2'
                 onChange={(event)=>onHandleInputChange('jobPosition',event.target.value)}
                 />
            </div>

            <div className='mt-5'>
                <h2 className='text-sm font-medium'>Job Description</h2>
                <Textarea placeholder='Enter Detail Job Description' className='h-[200px] mt-2'
                 onChange={(event)=>onHandleInputChange('jobDescription',event.target.value)}
                />
            </div>
            <div className='mt-5'>
                <h2 className='text-sm font-medium'>Interview Duration</h2>
                <Select onValueChange={(value)=>onHandleInputChange('duration',value)}>
                    <SelectTrigger className="w-full mt-2">
                        <SelectValue placeholder="Select Duration" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="5 Minutes">5 minutes</SelectItem>
                        <SelectItem value="15 Minutes">15 minutes</SelectItem>
                        <SelectItem value="30 Minutes">30 minutes</SelectItem>
                        <SelectItem value="45 Minutes">45 minutes</SelectItem>
                        <SelectItem value="60 Minutes">1 hour</SelectItem>
                        <SelectItem value="90 Minutes">1.5 hours</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className='mt-5'>
                <h2 className='text-sm font-medium'>Interview Type</h2>
                <div className='flex gap-3 flex-wrap mt-2'>
                    {InterviewType.map((type, index) => (
                        <div 
                            key={index} 
                            className={`flex items-center cursor-pointer gap-2 p-1 px-2 rounded-2xl hover:bg-secondary ${
                                interviewType.includes(type.title) ? 'bg-blue-100 text-primary' : 'bg-gray-50'
                            }`}
                            onClick={() => {
                                setInterviewType(prev => 
                                    prev.includes(type.title) 
                                        ? prev.filter(item => item !== type.title)
                                        : [...prev, type.title]
                                )
                            }}
                        >
                            <type.icon className='h-5 w-5 text-primary'/>
                            <span>{type.title}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className='mt-8 flex-justify-end' onClick={()=>GoToNext()}>
                <Button className='flex items-center gap-2'>
                    Generate Question
                    <ArrowRight className='h-4 w-4'/>
                </Button>
            </div>
        </div>
    )
}

export default FormContainer