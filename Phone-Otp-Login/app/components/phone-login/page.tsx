"use client"

import { auth } from '@/firebase/config';
import { ConfirmationResult, signInWithPhoneNumber } from 'firebase/auth';
import { RecaptchaVerifier } from 'firebase/auth';

import  React, { useState } from 'react'
import { useRouter } from 'next/navigation';
import checkUserStatus from '@/app/api/checkUser/route';
import { PhoneLoginForm } from '../phonelogin/page';

const Authentication = () => {

  //Set up a router
  const router = useRouter();

  //State for phone number
  const [phone, setPhone] = useState('');

  //State for otp
  const [otp, setOtp] = useState('');

  //State for verification of otp
  const [verifiedOTP, setVerifiedOTP] = useState(false);

  //State for confirmation of otp, it is null at start and changes based on confirmation result
  const [confirmation, setConfirmation] = useState<ConfirmationResult|null>(null);

  const setUpRecaptcha = async () => {

    try {

      //This function sets up a recaptcha such that, it is invisible and is mounted on 'recaptcha-container'
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth,'recaptcha-container',
          {
            size: 'invisible',
            callback: () => {console.log("reCAPTCHA Verified")}
          } 
        );
      }
      await window.recaptchaVerifier.verify(); // Explicitly verify


    } 
    catch (error) {
      console.error("ReCaptcha not set up properly", error);
    }

  }

  const sendOTP = async () => {

    try {

      //Sets up recaptcha as soon as OTP is desired for
      await setUpRecaptcha();

      //Formats phone number into the format it requires
      let formattedPhone = phone.startsWith("+91") ? phone : "+91" + phone.replace(/\D/g, '');

      //Stores the recaptchaVerifier object into a variable
      const appVerifier = window.recaptchaVerifier;
  
      //It sends an OTP SMS to the phone number you give it, only if the appVerifier (invisible reCAPTCHA) check passes
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);

      //Updates confirmation state
      setConfirmation(confirmationResult);

      console.log("OTP sent!");

    } 
    
    catch (error) {
      console.error("OTP sending failed:", error);
    }

  }

  

  const verifyOTP = async () => {
    
    try {

      if(confirmation){

        //Checks if the OTP is valid and goes to catch block if invalid
        const result = await confirmation.confirm(otp);

        //Stores that OTP has been verified
        setVerifiedOTP(true);

        //Stores the signed or logged in user object in a variable
        const user = result.user;

        //Check if user existed before this by passing its unique id
        const userExisted = await checkUserStatus(user.uid);

        //Sends existing user to dashboard
        if(userExisted){
          setTimeout(() => {
          router.push('dashboard')
          }, 800)
        }

        //Sends new user for entering their details
        else setTimeout(() => {
          router.push('newuser')
          }, 800)

      }

    }

    catch (error) {
      console.error("OTP verification failed:", error);
      alert("Invalid OTP. Please try again.");
    }
  }

  return (
    <div>
       <PhoneLoginForm
      phone={phone}
      setPhone={setPhone}
      otp={otp}
      setOtp={setOtp}
      sendOTP={sendOTP}
      verifyOTP={verifyOTP}
      verifiedOTP={verifiedOTP}
    />
    </div>
  )
}

export default Authentication
