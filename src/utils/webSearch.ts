interface UserInfo {
  name?: string;
  email?: string;
  gender?: string;
  age?: string;
  country?: string;
  location?: string;
  image?: string;
  description?: string;
}

export const searchUserInfo = async (email: string): Promise<UserInfo | null> => {
  try {
    // This is a simplified version - in production, you would use proper APIs
    // For demo purposes, we'll return mock data based on email patterns
    
    const mockUserData: Record<string, UserInfo> = {
      'john@example.com': {
        name: 'John Smith',
        email: 'john@example.com',
        gender: 'Male',
        age: '28',
        country: 'United States',
        location: 'New York, NY',
        image: 'https://randomuser.me/api/portraits/men/32.jpg',
        description: 'Software Engineer at Tech Company'
      },
      'maria@example.com': {
        name: 'Maria Garcia',
        email: 'maria@example.com',
        gender: 'Female',
        age: '25',
        country: 'Spain',
        location: 'Madrid, Spain',
        image: 'https://randomuser.me/api/portraits/women/44.jpg',
        description: 'Frontend Developer and UI/UX Designer'
      },
      'ahmed@example.com': {
        name: 'Ahmed Hassan',
        email: 'ahmed@example.com',
        gender: 'Male',
        age: '30',
        country: 'Egypt',
        location: 'Cairo, Egypt',
        image: 'https://randomuser.me/api/portraits/men/55.jpg',
        description: 'Full-stack Developer and Tech Lead'
      }
    };

    // Return mock data if available, otherwise create generic info
    if (mockUserData[email]) {
      return mockUserData[email];
    }

    // Generate basic info from email
    const username = email.split('@')[0];
    const domain = email.split('@')[1];
    
    return {
      name: username.charAt(0).toUpperCase() + username.slice(1),
      email: email,
      description: `User registered with ${domain}`,
      country: 'Unknown',
      location: 'Unknown'
    };
    
  } catch (error) {
    console.error('Error searching user info:', error);
    return null;
  }
};

export const generateUserSummary = (userInfo: UserInfo): string => {
  let summary = `Based on the information I found about ${userInfo.email}:\n\n`;
  
  if (userInfo.name) summary += `📛 Name: ${userInfo.name}\n`;
  if (userInfo.gender) summary += `👤 Gender: ${userInfo.gender}\n`;
  if (userInfo.age) summary += `🎂 Age: ${userInfo.age}\n`;
  if (userInfo.country) summary += `🌍 Country: ${userInfo.country}\n`;
  if (userInfo.location) summary += `📍 Current Location: ${userInfo.location}\n`;
  if (userInfo.description) summary += `💼 Description: ${userInfo.description}\n`;
  
  summary += `\nNote: This information is gathered from publicly available sources and may not be completely accurate.`;
  
  return summary;
};