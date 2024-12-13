import axios from 'axios';

interface Course {
  courseCode: string;
  courseName: string;
  coursePoints: string;
  subjectParent: {
    startDate: string;
    modifiedDate: string;
    version: number;
    subjectCode: string;
    subjectName: string;
    schoolTypes: string[];
    categories: {
      name: string;
      code: string;
    }[];
  };
}

interface CourseDetails {
  course: {
    code: string;
    name: string;
    points: string;
    description?: string;
    knowledgeRequirements?: {
      gradeStep: string;
      text: string;
    }[];
    assessmentCriteria?: {
      gradeStep: string;
      text: string;
    }[];
    centralContent: {
      text: string;
    };
    aims?: string;
    subjectParent: {
      subjectPurpose: string;
    };
    modifiedDate?: string;
  };
}

const API_VERSION = 'v1';
const API_BASE_URL = 'https://api.skolverket.se/syllabus';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'GY11-GY25-Comparison/1.0'
  },
  timeout: 10000, // 10 seconds
  validateStatus: (status) => status >= 200 && status < 300 // Only accept 2xx status codes
});

const getCurrentDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export async function getCourseDetails(courseCode: string, type?: 'gy11' | 'gy25'): Promise<CourseDetails['course']> {
  if (!courseCode) {
    throw new Error('No course code provided');
  }

  const isGy25 = type === 'gy25';
  const params = {
    date: isGy25 ? '2025-07-01' : getCurrentDate(),
    timespan: isGy25 ? 'SPECIFIC' : 'LATEST'
  };

  try {
    const response = await apiClient.get(`/${API_VERSION}/courses/${courseCode}`, { params });
    
    if (!response?.data?.course) {
      throw new Error(`No course data received for ${courseCode}`);
    }

    const course = response.data.course;

    // For GY25 courses, ensure assessment criteria are mapped to knowledge requirements
    if (isGy25 && course.assessmentCriteria && !course.knowledgeRequirements) {
      course.knowledgeRequirements = course.assessmentCriteria;
    }

    return course;
  } catch (error) {
    throw new Error(`Could not fetch course details for ${courseCode}`);
  }
}
