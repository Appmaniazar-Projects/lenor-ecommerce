"use client"

import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">Contact Us</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Get in touch with our team to discuss your branded merchandise needs. 
              We're here to help you find the perfect products for your business.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="shadow-sm border-gray-100">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Get In Touch
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-gray-600">info@lenor.co.za</p>
                      <p className="text-gray-600">quotes@lenor.co.za</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Phone</p>
                      <p className="text-gray-600">+27 11 234 5678</p>
                      <p className="text-gray-600">+27 83 456 7890</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Office</p>
                      <p className="text-gray-600">
                        100 Main Road, Sandton
                        <br />
                        Johannesburg, 2196
                        <br />
                        South Africa
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Business Hours</p>
                      <p className="text-gray-600">Monday - Friday: 8:00 AM - 5:00 PM</p>
                      <p className="text-gray-600">Saturday: 9:00 AM - 1:00 PM</p>
                      <p className="text-gray-600">Sunday: Closed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-sm border-gray-100">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => window.location.href = '/products'}
                  >
                    Browse Products
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => window.location.href = '/quote'}
                  >
                    Request a Quote
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => window.open('mailto:info@lenor.co.za')}
                  >
                    Send Email
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-sm border-gray-100">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Send us a Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6" onSubmit={(e) => {
                    e.preventDefault()
                    // Handle form submission
                    alert('Thank you for your message! We will get back to you soon.')
                  }}>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <Input
                          id="firstName"
                          name="firstName"
                          required
                          className="border-gray-200 focus:border-gray-400"
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <Input
                          id="lastName"
                          name="lastName"
                          required
                          className="border-gray-200 focus:border-gray-400"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          className="border-gray-200 focus:border-gray-400"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          className="border-gray-200 focus:border-gray-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name *
                      </label>
                      <Input
                        id="company"
                        name="company"
                        required
                        className="border-gray-200 focus:border-gray-400"
                      />
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <Input
                        id="subject"
                        name="subject"
                        required
                        placeholder="e.g., Product Inquiry, Quote Request, General Question"
                        className="border-gray-200 focus:border-gray-400"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Message *
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        rows={6}
                        placeholder="Tell us about your branded merchandise needs..."
                        className="border-gray-200 focus:border-gray-400 resize-none"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                      size="lg"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-sm border-gray-100">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">What is your minimum order quantity?</h3>
                  <p className="text-gray-600">Minimum order quantities vary by product, typically ranging from 10-100 units. Check individual product pages for specific MOQ requirements.</p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-gray-100">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">How long does production take?</h3>
                  <p className="text-gray-600">Standard production time is 7-14 working days after artwork approval. Express options are available for urgent orders.</p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-gray-100">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Do you offer design services?</h3>
                  <p className="text-gray-600">Yes, we provide free basic design assistance. Our team can help optimize your logo for the best branding results.</p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-gray-100">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
                  <p className="text-gray-600">We accept EFT, credit cards, and debit orders. Payment terms are available for approved corporate accounts.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <SiteFooter />
    </div>
  )
}
