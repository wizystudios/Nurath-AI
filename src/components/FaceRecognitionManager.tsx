
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Camera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RelationshipTag {
  id: string;
  name: string;
  relationship: string;
  imageUrl?: string;
  created_at?: string;
}

const FaceRecognitionManager = () => {
  const [relationships, setRelationships] = useState<RelationshipTag[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonRelationship, setNewPersonRelationship] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Load saved relationships
  React.useEffect(() => {
    loadRelationships();
  }, []);

  const loadRelationships = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // In a real implementation, you'd have a dedicated table for face recognition data
      // For now, we'll simulate with local storage
      const saved = localStorage.getItem('nurath_relationships');
      if (saved) {
        setRelationships(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading relationships:', error);
    }
  };

  const saveRelationship = async () => {
    if (!newPersonName.trim() || !newPersonRelationship.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const newRelationship: RelationshipTag = {
      id: Date.now().toString(),
      name: newPersonName.trim(),
      relationship: newPersonRelationship.trim(),
      imageUrl: uploadedImage,
      created_at: new Date().toISOString()
    };

    const updatedRelationships = [...relationships, newRelationship];
    setRelationships(updatedRelationships);
    
    // Save to localStorage (in real implementation, save to Supabase)
    localStorage.setItem('nurath_relationships', JSON.stringify(updatedRelationships));
    
    toast.success(`Added ${newPersonName} as your ${newPersonRelationship}! 👥`);
    
    // Reset form
    setNewPersonName("");
    setNewPersonRelationship("");
    setUploadedImage(null);
    setIsDialogOpen(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteRelationship = (id: string) => {
    const updatedRelationships = relationships.filter(r => r.id !== id);
    setRelationships(updatedRelationships);
    localStorage.setItem('nurath_relationships', JSON.stringify(updatedRelationships));
    toast.success("Relationship removed");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Family & Friends Recognition
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Person
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Family Member or Friend</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    placeholder="e.g., Sarah, Mom, John"
                  />
                </div>
                <div>
                  <Label htmlFor="relationship">Relationship</Label>
                  <Input
                    id="relationship"
                    value={newPersonRelationship}
                    onChange={(e) => setNewPersonRelationship(e.target.value)}
                    placeholder="e.g., Mother, Sister, Best Friend, Teacher"
                  />
                </div>
                <div>
                  <Label htmlFor="photo">Photo (Optional)</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  {uploadedImage && (
                    <div className="mt-2">
                      <img 
                        src={uploadedImage} 
                        alt="Preview" 
                        className="w-20 h-20 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
                <Button onClick={saveRelationship} className="w-full">
                  Save Person
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {relationships.length > 0 ? (
          <div className="space-y-3">
            {relationships.map((person) => (
              <div key={person.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  {person.imageUrl ? (
                    <img 
                      src={person.imageUrl} 
                      alt={person.name}
                      className="w-10 h-10 object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-medium">
                      {person.name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{person.name}</p>
                    <p className="text-sm text-gray-500">{person.relationship}</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => deleteRelationship(person.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="mb-2">No people added yet</p>
            <p className="text-sm">Add your family and friends so I can recognize them in photos!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FaceRecognitionManager;
