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
    'Accept': 'application/json'
  }
});

const getCurrentDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export const getCourseDetails = async (courseCode: string, type?: 'gy11' | 'gy25'): Promise<CourseDetails['course']> => {
  if (!courseCode) {
    throw new Error('No course code provided');
  }

  const isGy25 = type === 'gy25' || (!type && (
    /\d{4}X$/.test(courseCode) || 
    courseCode.includes('00X') || 
    courseCode.length === 8 
  ));

  const currentDate = getCurrentDate();
  const url = `/${API_VERSION}/courses/${courseCode}`;
  
  try {
    const response = await apiClient.get<CourseDetails>(url, {
      params: { date: currentDate }
    });

    if (!response?.data?.course) {
      throw new Error(`No course data received for ${courseCode}`);
    }

    const course = response.data.course;

    if (isGy25 && course.assessmentCriteria && !course.knowledgeRequirements) {
      course.knowledgeRequirements = course.assessmentCriteria;
    }

    return course;
  } catch (error) {
    if (isGy25 && error.response?.status === 404) {
      try {
        const futureResponse = await apiClient.get<CourseDetails>(url, {
          params: { date: '2025-07-01' }
        });

        if (!futureResponse?.data?.course) {
          throw new Error(`No course data received for ${courseCode}`);
        }

        const course = futureResponse.data.course;
        if (course.assessmentCriteria && !course.knowledgeRequirements) {
          course.knowledgeRequirements = course.assessmentCriteria;
        }

        return course;
      } catch (futureError) {
        throw new Error(`Could not fetch course details for ${courseCode}`);
      }
    }

    throw new Error(`Could not fetch course details for ${courseCode}`);
  }
};
