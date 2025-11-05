"use client"
import { UserDetailContext } from '@/context/UserDetailContext'
import React, { useContext, useEffect } from 'react'
import Image from 'next/image'

function WelcomeContainer(){
    const contextValue = useContext(UserDetailContext);
    const user = contextValue?.user;

    // Get the image source - check multiple possible locations
    const getImageSrc = () => {
        return user?.picture || 
               user?.user_metadata?.picture || 
               user?.avatar_url || 
               user?.user_metadata?.avatar_url ||
               null;
    };

    const imageSource = getImageSrc();
    
    useEffect(() => {
        console.log('Context Value:', contextValue);
        console.log('User:', user);
        console.log('User picture:', user?.picture);
        console.log('User metadata picture:', user?.user_metadata?.picture);
        console.log('Full user object:', JSON.stringify(user, null, 2));
        console.log('Image source selected:', imageSource);
    }, [contextValue, user, imageSource]);
    
    return(
        <div className='  bg-white p-5 rounded-xl  flex justify-between item-center'>
            <div >
               <h2 className='text-lg font-bold'>
                 Welcome Back, {user?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}!
               </h2>
               <h2 className='text-gray-500 font-medium'>Ai-Driven-Interview, Hassel-Free Hiring</h2>
            </div>
            {imageSource ? (
                <div className="mt-3">
                    <Image 
                        src={imageSource} 
                        alt='userAvatar' 
                        width={50} 
                        height={50}
                        className="rounded-full"
                        onError={(e) => {
                            console.log('Image failed to load:', imageSource, e);
                        }}
                        onLoad={() => {
                            console.log('Image loaded successfully:', imageSource);
                        }}
                    />
                </div>
            ) : (
                <div className="mt-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-lg font-bold">
                            {(user?.name || user?.user_metadata?.name || user?.email)?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}

export default WelcomeContainer