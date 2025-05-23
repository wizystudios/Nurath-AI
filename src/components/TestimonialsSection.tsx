
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, Plus } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const TestimonialsSection = () => {
  const [newTestimonial, setNewTestimonial] = useState({
    name: '',
    role: '',
    text: '',
    rating: 5
  });

  const [testimonials, setTestimonials] = useState([
    {
      id: 1,
      name: "Maria Johnson",
      role: "Software Developer",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      text: "Nurath.AI completely transformed how I learn programming. The AI feedback is incredibly helpful!",
      rating: 5,
      verified: true
    },
    {
      id: 2,
      name: "Ahmed Hassan",
      role: "CS Student",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      text: "I went from knowing nothing about coding to building my own web apps in just 3 months!",
      rating: 5,
      verified: true
    },
    {
      id: 3,
      name: "Grace Mwangi",
      role: "Frontend Engineer",
      image: "https://randomuser.me/api/portraits/women/68.jpg",
      text: "The AI assistance is like having a personal tutor available 24/7. Absolutely incredible.",
      rating: 5,
      verified: true
    }
  ]);

  const handleSubmitTestimonial = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTestimonial.name || !newTestimonial.role || !newTestimonial.text) {
      toast.error("Please fill in all fields");
      return;
    }

    const testimonial = {
      id: Date.now(),
      ...newTestimonial,
      image: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'women' : 'men'}/${Math.floor(Math.random() * 100)}.jpg`,
      verified: false
    };

    setTestimonials([...testimonials, testimonial]);
    setNewTestimonial({ name: '', role: '', text: '', rating: 5 });
    toast.success("Thank you for your feedback! It will be reviewed before publishing.");
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
            Join thousands of learners who have transformed their careers with Nurath.AI
          </p>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                Share Your Experience
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Share Your Experience</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitTestimonial} className="space-y-4">
                <div>
                  <Input
                    placeholder="Your Name"
                    value={newTestimonial.name}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Input
                    placeholder="Your Role/Title"
                    value={newTestimonial.role}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, role: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNewTestimonial({ ...newTestimonial, rating: i + 1 })}
                        className="p-0 border-none bg-transparent"
                      >
                        <Star
                          className={`h-6 w-6 ${i < newTestimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Textarea
                    placeholder="Share your experience with Nurath.AI..."
                    value={newTestimonial.text}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, text: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Submit Testimonial
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="border-none shadow-lg hover:shadow-xl transition-shadow bg-white dark:bg-gray-900">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-bold flex items-center gap-2">
                      {testimonial.name}
                      {testimonial.verified && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Verified
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                    <div className="flex mt-1">
                      {renderStars(testimonial.rating)}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 italic">"{testimonial.text}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
