import AssetOne from "../Assets/Pictures/asset-1.png"
import AssetTwo from "../Assets/Pictures/asset-2.png"
import AssetThree from "../Assets/Pictures/asset-3.png"
import AssetFour from "../Assets/Pictures/asset-4.png"
const en = {
    landing: {
        seeColleges: "See colleges",
        qAndA: "Q&A",
        about: "About",
        contactUs: "Contact us",
        project: "PROJECT",
        campus: "CAMPUS",
        getStarted: "Get Started",
        slides: [
            {
                description: "“The platform is super clean and intuitive, I feel at home!”",
                image: AssetOne
                
            },
            {
                description: "“I love connecting with students from other universties here.”",
                image: AssetTwo
            },
           
            {
                description: "“I can see all my university info in one place, it's so easy! ”",
                image: AssetThree
            },
            {
                description: "Finding professors and contatcing them has never been simpler.”",
                image: AssetFour
            }
        ]

    },
    auth: {
        Login: {
            homepage: "Homepage",
            login: "Login",
            signup: "Sign Up",
            project: "PROJECT",
            campus: "CAMPUS",
            username: "Username",
            password: "Password",
            needHelp: {
                text: "Need ",
                link: "help",
                afterLink: "?"
            },
            rememberMe: "Remember me",
            submitLogin: "Login",
            copyright: "© 2024 Project Campus. All rights reserved."
        },
        Signup: {
            homepage: "Homepage",
            login: "Login",
            signup: "Sign Up",
            project: "PROJECT",
            campus: "CAMPUS",
            username: "Create User name",
            academicEmail: "Academic Email",
            personalEmail: "Personal Email",
            password: "Password",
            confirmPassword: "Confirm Password",
            resendCode: "resend Verification Code",
            loading: "Loading...",
            sendCode    : "Send Verification Code",
            confirmCode  : "Confirm Code",
            createAccount : "Create Account",

            needHelp: {
                text: "Need ",
                link: "help",
                afterLink: "?"
            },
            submitSignup: "Sign Up",
            copyright: "© 2024 Project Campus. All rights reserved."
        }
    }






}



export default en;
