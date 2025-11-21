import React from 'react'
import Link from 'next/link' // Import Link for navigation
import { XCircle, Home } from 'lucide-react' // Icons for visual appeal
import { Button } from '@/components/ui/button' // Assuming you use shadcn/ui Button

function CheckoutCancelPage() {
  return (
    // The min-h-screen and flex classes center the content vertically and horizontally
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F5F5F5]">
      <div className="w-full max-w-lg p-10 bg-white border border-gray-200 shadow-xl rounded-xl text-center">
        
        {/* Icon: Red X for Cancelation */}
        <div className="flex justify-center mb-6">
          <XCircle className="h-16 w-16 text-red-500" />
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">
          Checkout Failed or Canceled
        </h1>
        
        {/* Description */}
        <p className="text-md text-gray-600 mb-8">
          Your payment could not be processed, or you canceled the checkout process.
          No charges were made to your account. Please try again or contact support if the issue persists.
        </p>
        
        {/* Button to return home */}
        <Link href="/" passHref>
          <Button className="w-full sm:w-auto px-8 py-2 text-md font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Home className="w-5 h-5 mr-2" />
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default CheckoutCancelPage