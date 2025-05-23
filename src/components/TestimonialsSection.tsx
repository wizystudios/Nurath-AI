
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, Plus, Upload } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const TestimonialsSection = () => {
  const [newTestimonial, setNewTestimonial] = useState({
    name: '',
    role: '',
    text: '',
    rating: 5,
    image: ''
  });

  const [testimonials, setTestimonials] = useState([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setNewTestimonial({...newTestimonial, image: reader.result as string});
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitTestimonial = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTestimonial.name || !newTestimonial.role || !newTestimonial.text) {
      toast.error("Please fill in all fields");
      return;
    }

    const testimonial = {
      id: Date.now(),
      ...newTestimonial,
      verified: false
    };

    setTestimonials([...testimonials, testimonial]);
    setNewTestimonial({ name: '', role: '', text: '', rating: 5, image: '' });
    setImagePreview(null);
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Share Your Experience</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
            Join the Nurath.AI community and share how AI has helped your coding journey
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
                  <label className="block text-sm font-medium mb-2">Profile Image</label>
                  <div className="flex items-center gap-4">
                    {imagePreview && (
                      <div className="w-12 h-12 rounded-full overflow-hidden">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">Upload Photo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
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
          {testimonials.length > 0 ? (
            testimonials.map((testimonial: any) => (
              <Card key={testimonial.id} className="border-none shadow-lg hover:shadow-xl transition-shadow bg-white dark:bg-gray-900">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    {testimonial.image ? (
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full mr-4 object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mr-4">
                        <span className="text-white font-bold text-lg">
                          {testimonial.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold">{testimonial.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                      <div className="flex mt-1">
                        {renderStars(testimonial.rating)}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 italic">"{testimonial.text}"</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Be the first to share your experience!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
