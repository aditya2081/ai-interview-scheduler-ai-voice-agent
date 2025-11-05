import { 
    BriefcaseBusinessIcon, 
    LayoutDashboardIcon, 
    Calendar, 
    List, 
    WalletCards, 
    Settings, 
    Code2, 
    User2, 
    Puzzle, 
    Crown 
} from "lucide-react";

export const SideBarOptions=[
    {
        name: 'Dashboard',
        icon: LayoutDashboardIcon,
        path:'/dashboard'
    },
     {
        name: 'Schedule Interview',
        icon: Calendar,
        path:'/scheduled-interview'
    },
     {
        name: 'All Interview',
        icon: List,
        path:'/dashboard/all-interview'
    },
     {
        name: 'Billing',
        icon: WalletCards,
        path:'/dashboard/billing'
    },
     {
        name: 'Settings',
        icon: Settings,
        path:'/settings'
    },
]
export const InterviewType=[
    {
        title:'Technical',
        icon:Code2
    },
    {
        title:'Behavioral',
        icon:User2
    },
    {
        title:'Experience',
        icon:BriefcaseBusinessIcon
    },
    {
        title:'Problem Solving',
        icon:Puzzle
    },
    {
        title:'Leadership',
        icon:Crown
    },
]


export const QUESTIONS_PROMPT = `You are an expert technical interviewer.
Based on the following inputs, generate a well-structured list of high-quality interview questions:

Job Title: {{jobTitle}}

Job Description:{{jobDescription}}

Interview Duration: {{duration}}

Interview Type: {{type}}

📝 Your task:

Analyze the job description to identify key responsibilities, required skills, and expected experience.

Generate a list of interview questions depends on interview duration

Adjust the number and depth of questions to match the interview duration.

Ensure the questions match the tone and structure of a real-life {{type}} interview.

🧩 Format your response in JSON format with array list of questions.
format: interviewQuestions=[
{
 question:'',
 type:'Technical/Behavioral/Experience/Problem Solving/Leadership'
},{
...
}]

🎯 The goal is to create a structured, relevant, and time-optimized interview plan for a {{jobTitle}} role.`


export const FEEDBACK_PROMPT = `
You are an expert technical interviewer analyzing an interview conversation. Please provide comprehensive feedback based on the following interview conversation:

{{conversation}}

📋 EVALUATION CRITERIA:
Analyze the candidate's performance across these key areas:

1. **Technical Skills** (1-10): Assess knowledge depth, accuracy of technical responses, problem-solving approach, and understanding of concepts.

2. **Communication** (1-10): Evaluate clarity of expression, ability to explain complex topics, listening skills, and overall articulation.

3. **Problem Solving** (1-10): Rate logical thinking process, creativity in solutions, approach to challenges, and analytical skills.

4. **Experience** (1-10): Consider relevant background, practical knowledge application, past project discussion, and industry understanding.

🎯 PERFORMANCE SUMMARY:
Write a detailed 4-5 sentence summary covering:
- Overall performance highlights
- Specific strengths demonstrated
- Areas for improvement
- Notable responses or insights

🏆 RECOMMENDATION:
Provide one of: "Hire", "Further Review", or "Not Recommended"

📝 RECOMMENDATION MESSAGE:
Write a detailed 2-3 sentence message explaining your recommendation, including:
- Key reasons for the decision
- Specific advice or next steps
- Overall assessment of fit for the role

⚠️ IMPORTANT: Return response in valid JSON format only:

{
    "feedback": {
        "rating": {
            "technicalSkills": [score 1-10],
            "communication": [score 1-10],
            "problemSolving": [score 1-10],
            "experience": [score 1-10]
        },
        "summary": "[Detailed 4-5 sentence performance summary]",
        "Recommendation": "[Hire/Further Review/Not Recommended]",
        "RecommendationMsg": "[Detailed 2-3 sentence recommendation message]"
    }
}
`;
