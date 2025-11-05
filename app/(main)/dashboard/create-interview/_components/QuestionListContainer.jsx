import React from 'react'

function QuestionListContainer({ QuestionList = [] }) {
    return (
        <div>
            <h2 className='font-bold text-lg mb-5'>Generated Interview Questions:</h2>
            
            {QuestionList.length === 0 ? (
                <div className='p-5 border border-gray-300 rounded-xl bg-white'>
                    <p className='text-gray-500 text-center'>No questions generated yet.</p>
                </div>
            ) : (
                <div className='space-y-3'>
                    {QuestionList.map((item, index) => (
                        <div key={index} className='bg-gray-50 p-4 rounded-lg border'>
                            <h4 className='font-medium text-gray-800 mb-2'>
                                Question {index + 1}:
                            </h4>
                            <h2 className='font-medium text-gray-700 mb-2'>
                                {item.question || item.questtion}
                            </h2>
                            <div className='flex items-center gap-2'>
                                <h2 className='text-sm text-primary font-medium'>Type:</h2>
                                <span className='text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded'>
                                    {item.type || 'General'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default QuestionListContainer