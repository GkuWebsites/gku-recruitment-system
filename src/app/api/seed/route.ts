import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { HiringRequestModel } from '@/lib/models/HiringRequest';
import { AcademicDepartment, EmploymentType, HiringStatus, IHiringRequest, UserRole } from '@/lib/types';

const DEPARTMENTS: {
  name: AcademicDepartment;
  deanName: string;
  deanEmail: string;
  hodName: string;
  hodEmail: string;
  specializations: {
    postTitle: string;
    postLevel: string;
    employmentType: EmploymentType;
    qualifications: string;
    experience: string;
    budget: string;
    budgetNum: number;
    justification: string;
  }[];
}[] = [
  {
    name: 'Computer Science & Engineering',
    deanName: 'Dr. Gurwinder Singh',
    deanEmail: 'dean.engg@gku.ac.in',
    hodName: 'Dr. Arvinder Singh',
    hodEmail: 'hod.cse@gku.ac.in',
    specializations: [
      {
        postTitle: 'Professor & Head (Cybersecurity & Cryptography)',
        postLevel: 'Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. in CSE / Information Security with First Class B.Tech and M.Tech. Minimum 10 publications in SCI/Scopus indexed journals and 2 Ph.D. students guided.',
        experience: '10+ Years in University Teaching / High-impact Industrial Cybersecurity R&D',
        budget: '₹22,00,000 - ₹26,00,000 p.a. + HRA',
        budgetNum: 2400000,
        justification: 'New M.Tech Cybersecurity specialization sanctioned by AICTE with 30 intake. Requires senior professor to head the cyber-range lab.'
      },
      {
        postTitle: 'Associate Professor (Cloud Computing & DevOps)',
        postLevel: 'Associate Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. in Computer Science with AWS/Azure Solutions Architect or Kubernetes CKA certifications. Minimum 6 Scopus journal publications.',
        experience: '8 Years teaching / research experience after post-graduation',
        budget: '₹14,00,000 - ₹17,00,000 p.a.',
        budgetNum: 1550000,
        justification: 'Industry collaboration curriculum with AWS Academy mandates specialized faculty for distributed architectures.'
      },
      {
        postTitle: 'Assistant Professor (Artificial Intelligence & Machine Learning)',
        postLevel: 'Assistant Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. in Computer Science / AI / Deep Learning. Minimum 2 IEEE/Scopus publications. GATE qualified.',
        experience: '2 - 5 Years in University / AI Research Lab',
        budget: '₹8,40,000 - ₹10,80,000 p.a.',
        budgetNum: 960000,
        justification: 'High student enrollment in B.Tech AI & Data Science specialization; current faculty to student ratio is 1:26 against AICTE prescribed norm of 1:15.'
      },
      {
        postTitle: 'Assistant Professor (Full Stack Software Engineering)',
        postLevel: 'Assistant Professor',
        employmentType: 'Teaching',
        qualifications: 'M.Tech CSE with First Class, Ph.D. submitted / pursued. Proficiency in React, Node, microservices, and modern web architectures.',
        experience: '1 - 3 Years in software development / academic mentoring',
        budget: '₹7,20,000 - ₹9,00,000 p.a.',
        budgetNum: 810000,
        justification: 'Core practical laboratory workload increased by 18 hours per week with introduction of industry hackathon project track.'
      }
    ]
  },
  {
    name: 'Mechanical Engineering',
    deanName: 'Dr. Harinder Pal Singh',
    deanEmail: 'dean.mech@gku.ac.in',
    hodName: 'Dr. Bikramjit Singh',
    hodEmail: 'hod.mech@gku.ac.in',
    specializations: [
      {
        postTitle: 'Professor (Robotics & Autonomous Mechatronics)',
        postLevel: 'Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. in Mechanical / Robotics & Automation with B.Tech/M.Tech in Mechanical/Mechatronics. Minimum 10 SCI publications and patent grant track record.',
        experience: '10+ Years in teaching / industrial robotics and robotic vision',
        budget: '₹20,00,000 - ₹24,00,000 p.a. + HRA',
        budgetNum: 2200000,
        justification: 'Establishment of state-of-the-art Robotics and Industry 4.0 Centre of Excellence funded under DST extramural grant.'
      },
      {
        postTitle: 'Associate Professor (Thermal Engineering & EV Battery Systems)',
        postLevel: 'Associate Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. in Thermal Science / Fluid Dynamics with specialization in EV battery thermal management systems. Minimum 6 indexed publications.',
        experience: '8 Years teaching / EV automotive sector R&D',
        budget: '₹13,50,000 - ₹16,50,000 p.a.',
        budgetNum: 1500000,
        justification: 'Introduction of B.Tech minor in Electric Vehicle Technology requires faculty with expertise in thermal modeling and CFD simulation.'
      },
      {
        postTitle: 'Assistant Professor (CAD/CAM & Digital Manufacturing)',
        postLevel: 'Assistant Professor',
        employmentType: 'Teaching',
        qualifications: 'M.Tech in CAD/CAM / Production Engineering with Ph.D. in progress. Hands-on expertise in SolidWorks, ANSYS, and 5-axis CNC machining.',
        experience: '2 - 4 Years in academic workshop / precision manufacturing',
        budget: '₹7,50,000 - ₹9,50,000 p.a.',
        budgetNum: 850000,
        justification: 'Replacement for resigned faculty member who transitioned to DRDO; urgent need to sustain CNC machining workshop sessions.'
      }
    ]
  },
  {
    name: 'Management Studies',
    deanName: 'Dr. Amardeep Kaur',
    deanEmail: 'dean.mgmt@gku.ac.in',
    hodName: 'Dr. Puneet Walia',
    hodEmail: 'hod.mgmt@gku.ac.in',
    specializations: [
      {
        postTitle: 'Professor (Fintech & Strategic Financial Management)',
        postLevel: 'Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. in Management / Finance with MBA First Class. Track record of high-impact ABDC / Scopus publications and executive MDP delivery.',
        experience: '10+ Years in university business school or corporate finance leadership',
        budget: '₹21,00,000 - ₹25,00,000 p.a. + HRA',
        budgetNum: 2300000,
        justification: 'MBA intake expanded by 60 seats; NBA accreditation compliance requires a sanctioned Professor in Financial Management.'
      },
      {
        postTitle: 'Associate Professor (Human Resource Analytics & Organizational Behavior)',
        postLevel: 'Associate Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. in Human Resource Management with expertise in People Analytics, SPSS/R, and talent acquisition models. 6+ peer-reviewed papers.',
        experience: '8 Years post-graduate teaching / corporate talent consulting',
        budget: '₹13,00,000 - ₹16,00,000 p.a.',
        budgetNum: 1450000,
        justification: 'Faculty workload in MBA HR specialization exceeds UGC guidelines of 14 hours/week per senior faculty member.'
      },
      {
        postTitle: 'Assistant Professor (Digital Marketing & Social Commerce)',
        postLevel: 'Assistant Professor',
        employmentType: 'Teaching',
        qualifications: 'MBA in Marketing with First Class, UGC NET / JRF qualified, Ph.D. preferred. Google Ads & HubSpot certifications.',
        experience: '2 - 4 Years teaching / growth marketing agency experience',
        budget: '₹7,80,000 - ₹9,80,000 p.a.',
        budgetNum: 880000,
        justification: 'Elective course in Digital Marketing enrolled by 140 students across BBA and MBA programs.'
      }
    ]
  },
  {
    name: 'Agriculture & Forestry',
    deanName: 'Dr. Manjit Singh',
    deanEmail: 'dean.agri@gku.ac.in',
    hodName: 'Dr. Ravinder Pal Singh',
    hodEmail: 'hod.agri@gku.ac.in',
    specializations: [
      {
        postTitle: 'Professor & Head (Agronomy & Soil Conservation)',
        postLevel: 'Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. in Agronomy with B.Sc. and M.Sc. Agriculture (ICAR accredited). 10+ NAAS rated publications (>6.0) and extramural research grants.',
        experience: '12+ Years in Agricultural University / ICAR institute',
        budget: '₹22,00,000 - ₹27,00,000 p.a. + HRA',
        budgetNum: 2450000,
        justification: 'ICAR accreditation inspection committee mandated permanent full Professor as departmental head for B.Sc. (Hons) Agriculture.'
      },
      {
        postTitle: 'Associate Professor (Plant Breeding & Crop Genetics)',
        postLevel: 'Associate Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. in Genetics & Plant Breeding. Proven experience in molecular breeding, marker-assisted selection, and crop field trials.',
        experience: '8 Years post-doctoral / academic experience in ICAR recognized setup',
        budget: '₹14,50,000 - ₹17,50,000 p.a.',
        budgetNum: 1600000,
        justification: 'Research farm expansion to 50 acres requires lead scientist to supervise crop breeding trials and PG student dissertations.'
      },
      {
        postTitle: 'Assistant Professor (Agricultural Entomology & Pest Management)',
        postLevel: 'Assistant Professor',
        employmentType: 'Teaching',
        qualifications: 'M.Sc. and Ph.D. in Agricultural Entomology, ICAR-NET qualified. Expertise in biological pest control and IPM strategies.',
        experience: '2 - 5 Years in field experimentation and teaching',
        budget: '₹8,00,000 - ₹10,20,000 p.a.',
        budgetNum: 910000,
        justification: 'Mandatory course work under 5th Deans Committee recommendation requires additional dedicated entomology faculty.'
      }
    ]
  },
  {
    name: 'Pharmaceutical Sciences',
    deanName: 'Dr. Rameshwar Sharma',
    deanEmail: 'dean.pharma@gku.ac.in',
    hodName: 'Dr. Baljinder Singh',
    hodEmail: 'hod.pharma@gku.ac.in',
    specializations: [
      {
        postTitle: 'Professor (Pharmaceutics & Novel Drug Delivery Systems)',
        postLevel: 'Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. in Pharmaceutics with B.Pharm and M.Pharm First Class (PCI registered). Minimum 10 Scopus/PubMed indexed publications and 2 patents.',
        experience: '10+ Years in PCI approved Pharmacy College / Pharma Industry R&D',
        budget: '₹21,00,000 - ₹25,00,000 p.a. + HRA',
        budgetNum: 2300000,
        justification: 'PCI inspection compliance for annual intake of 100 B.Pharm and 15 M.Pharm Pharmaceutics seats.'
      },
      {
        postTitle: 'Associate Professor (Pharmacology & Toxicological Screening)',
        postLevel: 'Associate Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. in Pharmacology, registered with State Pharmacy Council. CPCSEA certified animal house handling and preclinical screening expertise.',
        experience: '8 Years teaching / preclinical research in pharma institution',
        budget: '₹13,80,000 - ₹16,80,000 p.a.',
        budgetNum: 1530000,
        justification: 'Animal house experimentation and clinical pharmacology labs require licensed faculty with CPCSEA clearance expertise.'
      },
      {
        postTitle: 'Assistant Professor (Pharmaceutical Chemistry & Drug Analysis)',
        postLevel: 'Assistant Professor',
        employmentType: 'Teaching',
        qualifications: 'M.Pharm in Pharmaceutical Chemistry / Analysis with GPAT qualification, Ph.D. pursued/completed. Hands-on HPLC, UV, and FTIR operation.',
        experience: '2 - 4 Years in analytical chemistry laboratory / teaching',
        budget: '₹8,20,000 - ₹10,50,000 p.a.',
        budgetNum: 935000,
        justification: 'Increase in B.Pharm batch practical sections necessitated split laboratory sessions to maintain 1:20 teacher-student ratio.'
      }
    ]
  },
  {
    name: 'Faculty of Law',
    deanName: 'Prof. (Dr.) Ravinderjit Kaur',
    deanEmail: 'dean.law@gku.ac.in',
    hodName: 'Dr. Sukhwinder Singh',
    hodEmail: 'hod.law@gku.ac.in',
    specializations: [
      {
        postTitle: 'Professor & Head (Constitutional Law & Comparative Jurisprudence)',
        postLevel: 'Professor',
        employmentType: 'Teaching',
        qualifications: 'LL.D. / Ph.D. in Law with LL.M. First Class. Bar Council of India compliant qualifications with 10+ publications in UGC CARE listed journals.',
        experience: '10+ Years in university law faculty / high court appellate litigation practice',
        budget: '₹22,00,000 - ₹26,00,000 p.a. + HRA',
        budgetNum: 2400000,
        justification: 'Bar Council of India (BCI) mandatory compliance for 5-Year Integrated BA.LL.B and B.Com.LL.B programmes.'
      },
      {
        postTitle: 'Associate Professor (Corporate, Commercial & Intellectual Property Law)',
        postLevel: 'Associate Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. in Law with specialization in Corporate Governance, Insolvency & Bankruptcy Code, or Patents/Trademarks law.',
        experience: '8 Years teaching in recognized law school / national law university',
        budget: '₹14,00,000 - ₹17,00,000 p.a.',
        budgetNum: 1550000,
        justification: 'New LL.M. one-year degree programme requires specialized faculty for Corporate & Commercial Law track.'
      },
      {
        postTitle: 'Assistant Professor (Criminal Procedure, Evidence & Cyber Crimes)',
        postLevel: 'Assistant Professor',
        employmentType: 'Teaching',
        qualifications: 'LL.M. with First Class, UGC NET / JRF qualified in Law. Expertise in modern digital forensics and criminal jurisprudence.',
        experience: '2 - 5 Years in law teaching or moot court coaching',
        budget: '₹8,00,000 - ₹10,00,000 p.a.',
        budgetNum: 900000,
        justification: 'Moot Court Society coordinator and clinical legal aid clinic supervisor required for BCI compliance.'
      }
    ]
  },
  {
    name: 'Basic & Applied Sciences',
    deanName: 'Dr. Sukhdev Singh',
    deanEmail: 'dean.sciences@gku.ac.in',
    hodName: 'Dr. Mandeep Sharma',
    hodEmail: 'hod.sciences@gku.ac.in',
    specializations: [
      {
        postTitle: 'Professor (Solid State & Condensed Matter Physics)',
        postLevel: 'Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. in Physics with Post-Doctoral research abroad. Minimum 12 SCI publications (total impact factor > 40) and sponsored DST/CSIR projects.',
        experience: '10+ Years in university teaching and advanced materials research',
        budget: '₹21,00,000 - ₹25,00,000 p.a. + HRA',
        budgetNum: 2300000,
        justification: 'Central Instrumentation Facility (CIF) requires senior professor to oversee SEM, XRD, and thin-film deposition facilities.'
      },
      {
        postTitle: 'Associate Professor (Organic Chemistry & Green Synthesis)',
        postLevel: 'Associate Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. in Organic Chemistry with expertise in microwave/ultrasound assisted organic synthesis and NMR spectroscopy. 8 SCI papers.',
        experience: '8 Years teaching / post-doc research',
        budget: '₹13,50,000 - ₹16,50,000 p.a.',
        budgetNum: 1500000,
        justification: 'Interdisciplinary research in bioactive small molecules requires senior organic chemist for synthetic chemistry lab.'
      },
      {
        postTitle: 'Assistant Professor (Applied Mathematics & Numerical Computing)',
        postLevel: 'Assistant Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. in Mathematics / Computational Fluid Dynamics, CSIR NET qualified. Expertise in MATLAB, Mathematica, and finite element modeling.',
        experience: '2 - 5 Years teaching engineering mathematics and PG mathematics',
        budget: '₹7,80,000 - ₹9,80,000 p.a.',
        budgetNum: 880000,
        justification: 'All first and second year B.Tech and B.Sc batches require advanced engineering mathematics lectures; 24 credit hours shortfall.'
      }
    ]
  },
  {
    name: 'Nursing & Allied Health Sciences',
    deanName: 'Dr. Jasleen Kaur',
    deanEmail: 'dean.nursing@gku.ac.in',
    hodName: 'Dr. Harpreet Kaur',
    hodEmail: 'hod.nursing@gku.ac.in',
    specializations: [
      {
        postTitle: 'Professor (Medical Surgical Nursing & Critical Care)',
        postLevel: 'Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. / M.Sc. Nursing in Medical Surgical Nursing (INC registered). Minimum 10 years experience with at least 5 years post-M.Sc. teaching.',
        experience: '10+ Years in INC recognized Nursing College / Multi-Specialty Hospital',
        budget: '₹18,00,000 - ₹22,00,000 p.a. + HRA',
        budgetNum: 2000000,
        justification: 'Indian Nursing Council (INC) inspection norm requires full-time Professor for 100-seat B.Sc. Nursing programme.'
      },
      {
        postTitle: 'Associate Professor (Community Health & Epidemiological Nursing)',
        postLevel: 'Associate Professor',
        employmentType: 'Teaching',
        qualifications: 'M.Sc. Nursing in Community Health with Ph.D. registered/completed. Extensive field experience in rural health centers and epidemiological surveys.',
        experience: '8 Years clinical and nursing collegiate teaching experience',
        budget: '₹12,50,000 - ₹15,50,000 p.a.',
        budgetNum: 1400000,
        justification: 'Supervision of rural community health center postings for final-year nursing interns across 8 adopted primary healthcare centers.'
      },
      {
        postTitle: 'Assistant Professor (Medical Laboratory Technology & Clinical Pathology)',
        postLevel: 'Assistant Professor',
        employmentType: 'Teaching',
        qualifications: 'M.Sc. MLT / Medical Biochemistry with Ph.D. preferred. Registered with Allied Health Council. Hands-on clinical diagnostics expertise.',
        experience: '2 - 4 Years in diagnostic laboratories / college teaching',
        budget: '₹7,00,000 - ₹9,00,000 p.a.',
        budgetNum: 800000,
        justification: 'B.Sc. MLT student strength doubled to 60 students; required for histopathology and haematology clinical postings.'
      }
    ]
  },
  {
    name: 'Education',
    deanName: 'Dr. Balwinder Singh',
    deanEmail: 'dean.edu@gku.ac.in',
    hodName: 'Dr. Kuldeep Singh',
    hodEmail: 'hod.edu@gku.ac.in',
    specializations: [
      {
        postTitle: 'Professor (Educational Technology & Curriculum Pedagogy)',
        postLevel: 'Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. in Education with M.Ed. First Class (NCTE compliant). Published books/monographs and minimum 10 research papers in peer-reviewed journals.',
        experience: '10+ Years in NCTE recognized Teacher Training Institution',
        budget: '₹19,00,000 - ₹23,00,000 p.a. + HRA',
        budgetNum: 2100000,
        justification: 'National Council for Teacher Education (NCTE) revised norms mandate dedicated Professor for Integrated Teacher Education Programme (ITEP).'
      },
      {
        postTitle: 'Associate Professor (Psychological Foundations & Child Development)',
        postLevel: 'Associate Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. in Education / Psychology with M.Ed. First Class. Expertise in cognitive assessment, psychometrics, and guidance counselling.',
        experience: '8 Years teaching B.Ed. and M.Ed. scholars',
        budget: '₹13,00,000 - ₹16,00,000 p.a.',
        budgetNum: 1450000,
        justification: 'School internship and practical child development laboratory observation modules require senior academic supervisor.'
      },
      {
        postTitle: 'Assistant Professor (Special & Inclusive Education)',
        postLevel: 'Assistant Professor',
        employmentType: 'Teaching',
        qualifications: 'M.Ed. in Special Education / B.Ed. Special Education with UGC NET in Education. Registered with Rehabilitation Council of India (RCI).',
        experience: '2 - 4 Years working with diverse learner cohorts',
        budget: '₹7,20,000 - ₹9,20,000 p.a.',
        budgetNum: 820000,
        justification: 'NEP 2020 inclusion guidelines mandate dedicated specialized faculty for inclusive classroom teaching strategies.'
      }
    ]
  },
  {
    name: 'Humanities & Languages',
    deanName: 'Dr. Paramjit Kaur',
    deanEmail: 'dean.humanities@gku.ac.in',
    hodName: 'Dr. Gurpreet Kaur',
    hodEmail: 'hod.humanities@gku.ac.in',
    specializations: [
      {
        postTitle: 'Professor (English Literature & Comparative Cultural Studies)',
        postLevel: 'Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. in English with M.A. First Class. Renowned literary critic with multiple university press books and 10+ UGC CARE publications.',
        experience: '10+ Years in university postgraduate English department',
        budget: '₹19,00,000 - ₹23,00,000 p.a. + HRA',
        budgetNum: 2100000,
        justification: 'Launch of Ph.D. English research programme requires recognized Ph.D. guide meeting UGC minimum criteria.'
      },
      {
        postTitle: 'Associate Professor (Linguistics & Professional Communication Skills)',
        postLevel: 'Associate Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. in Applied Linguistics / ELT. Certified trainer in IELTS/TOEFL and corporate communication soft-skills.',
        experience: '8 Years language laboratory and communicative English teaching',
        budget: '₹12,50,000 - ₹15,50,000 p.a.',
        budgetNum: 1400000,
        justification: 'Language lab instruction across all engineering, pharmacy, and management first-year cohorts requires dedicated coordinator.'
      },
      {
        postTitle: 'Assistant Professor (Punjabi Literature, Folklore & Cultural Heritage)',
        postLevel: 'Assistant Professor',
        employmentType: 'Teaching',
        qualifications: 'M.A. Punjabi with First Class, UGC NET / JRF qualified, Ph.D. completed. Proven work in Malwa regional folklore documentation.',
        experience: '2 - 5 Years teaching Punjabi literature and cultural studies',
        budget: '₹7,00,000 - ₹9,00,000 p.a.',
        budgetNum: 800000,
        justification: 'Compulsory regional language credits for 1,200 undergraduate students require faculty for tutorials and lectures.'
      }
    ]
  },
  {
    name: 'Commerce & Finance',
    deanName: 'Dr. Gurpreet Singh',
    deanEmail: 'dean.comm@gku.ac.in',
    hodName: 'Dr. Rajesh Sharma',
    hodEmail: 'hod.comm@gku.ac.in',
    specializations: [
      {
        postTitle: 'Professor (Banking, Corporate Governance & International Finance)',
        postLevel: 'Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. in Commerce / Finance with M.Com. First Class. Fellow Chartered Accountant (FCA) or Cost Accountant preferred. 10+ publications.',
        experience: '10+ Years teaching postgraduate commerce / capital markets',
        budget: '₹20,00,000 - ₹24,00,000 p.a. + HRA',
        budgetNum: 2200000,
        justification: 'M.Com. and B.Com (Honours) student intake expanded; compliance requirement for NAAC criterion on cadre ratio.'
      },
      {
        postTitle: 'Associate Professor (Auditing, Forensic Accounting & Direct Taxes)',
        postLevel: 'Associate Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. in Commerce / Accountancy with CA / CMA qualifications. 8 peer-reviewed research publications in taxation and forensic audit.',
        experience: '8 Years teaching / professional audit practice',
        budget: '₹13,50,000 - ₹16,50,000 p.a.',
        budgetNum: 1500000,
        justification: 'Elective specialization in Forensic Accounting & Fraud Investigation introduced in partnership with industry experts.'
      },
      {
        postTitle: 'Assistant Professor (Financial Econometrics & Business Statistics)',
        postLevel: 'Assistant Professor',
        employmentType: 'Teaching',
        qualifications: 'M.Com / M.Sc. Statistics with UGC NET in Commerce. Hands-on proficiency in R, Python, and EViews financial modeling.',
        experience: '2 - 4 Years teaching business mathematics and quantitative techniques',
        budget: '₹7,50,000 - ₹9,50,000 p.a.',
        budgetNum: 850000,
        justification: 'Quantitative courses require divided computer lab practical sessions for 180 B.Com (Honours) students.'
      }
    ]
  },
  {
    name: 'Physical Education & Sports',
    deanName: 'Dr. Harpreet Singh Dhillon',
    deanEmail: 'dean.sports@gku.ac.in',
    hodName: 'Dr. Jaspal Singh',
    hodEmail: 'hod.sports@gku.ac.in',
    specializations: [
      {
        postTitle: 'Professor (Exercise Physiology & Sports Biomechanics)',
        postLevel: 'Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. in Physical Education with M.P.Ed. First Class. Proven research in sports kinesiology, motion analysis, and athlete conditioning. 10+ papers.',
        experience: '10+ Years in university physical education department / national sports institute',
        budget: '₹19,00,000 - ₹23,00,000 p.a. + HRA',
        budgetNum: 2100000,
        justification: 'NCTE recognition for B.P.Ed and M.P.Ed courses mandates full Professor in Exercise Physiology.'
      },
      {
        postTitle: 'Associate Professor (Sports Psychology & High-Performance Conditioning)',
        postLevel: 'Associate Professor',
        employmentType: 'Teaching',
        qualifications: 'Ph.D. in Physical Education / Sports Psychology. Experience working with state/national level university athletes and psychological profiling.',
        experience: '8 Years teaching / elite athletic coaching',
        budget: '₹13,00,000 - ₹16,00,000 p.a.',
        budgetNum: 1450000,
        justification: 'All-India Inter-University tournament preparation camps require specialized sports psychologist and conditioning coach.'
      },
      {
        postTitle: 'Assistant Professor (Track & Field Athletics Coaching & Sports Management)',
        postLevel: 'Assistant Professor',
        employmentType: 'Teaching',
        qualifications: 'M.P.Ed. with UGC NET, NIS Diploma in Athletics coaching. State or national athletic competition representation.',
        experience: '2 - 5 Years collegiate athletics coaching and curriculum instruction',
        budget: '₹7,20,000 - ₹9,20,000 p.a.',
        budgetNum: 820000,
        justification: 'Management of 400m synthetic athletic track and coaching for varsity track-and-field squads.'
      }
    ]
  }
];

// Pool of candidate names and affiliations for realistic academic profiles
const CANDIDATE_NAMES = [
  { first: 'Manmohanjit Singh', last: 'Dhillon', affiliation: 'Punjab Agricultural University (PAU) Ludhiana', degree: 'Ph.D. Agronomy, Post-Doc (CSIRO Australia)' },
  { first: 'Ramanpreet', last: 'Kaur', affiliation: 'Thapar Institute of Engineering & Technology, Patiala', degree: 'Ph.D. in CSE (Deep Learning), M.Tech Gold Medalist' },
  { first: 'Amitav', last: 'Banerjee', affiliation: 'Indian Institute of Technology (IIT) Ropar', degree: 'Ph.D. (Computer Vision & Edge AI), B.Tech (IIT Kharagpur)' },
  { first: 'Navdeep', last: 'Sharma', affiliation: 'Chitkara College of Pharmacy, Rajpura', degree: 'Ph.D. Pharmaceutics (PCI Registered), M.Pharm' },
  { first: 'Gurpreet Singh', last: 'Sandhu', affiliation: 'Panjab University Chandigarh', degree: 'Ph.D. Chemistry, Post-Doc (Max Planck Germany)' },
  { first: 'Simranjeet', last: 'Kaur', affiliation: 'Guru Nanak Dev University (GNDU) Amritsar', degree: 'Ph.D. in Management, UGC-JRF, MBA First Class' },
  { first: 'Vikram', last: 'Aditya', affiliation: 'National Law University Delhi', degree: 'LL.M. (NLUD), Ph.D. in Cyber Laws & Intellectual Property' },
  { first: 'Harjot', last: 'Singh Brar', affiliation: 'Dr. B.R. Ambedkar National Institute of Technology (NIT) Jalandhar', degree: 'Ph.D. Mechanical (Thermal & Battery Storage), M.Tech' },
  { first: 'Meenakshi', last: 'Chawla', affiliation: 'Delhi University (Faculty of Management Studies)', degree: 'Ph.D. in Financial Econometrics, M.Com (SRCC)' },
  { first: 'Davinder', last: 'Singh Sidhu', affiliation: 'National Institute of Sports (NIS) Patiala', degree: 'Ph.D. Physical Education, NIS Athletics Gold Medalist' },
  { first: 'Priya', last: 'Sharma', affiliation: 'All India Institute of Medical Sciences (AIIMS) Bathinda', degree: 'M.Sc. Nursing (Critical Care), Ph.D. Nursing (INC Registered)' },
  { first: 'Jagdish', last: 'Chander Joshi', affiliation: 'Central University of Punjab, Bathinda', degree: 'Ph.D. in Education (Curriculum & Pedagogy), M.Ed.' },
  { first: 'Sandeep', last: 'Kumar Verma', affiliation: 'Punjabi University Patiala', degree: 'Ph.D. English Literature & Linguistics, M.A. Gold Medalist' },
  { first: 'Kulwinder', last: 'Singh Gill', affiliation: 'CSIR - Institute of Microbial Technology (IMTECH) Chandigarh', degree: 'Ph.D. Biotechnology & Genomics, CSIR-NET' },
  { first: 'Sunita', last: 'Rani Mehta', affiliation: 'Kurukshetra University', degree: 'Ph.D. in Law (Constitutional Law), BCI Registered Advocate' },
  { first: 'Rajesh', last: 'Kumar Sethi', affiliation: 'Birla Institute of Technology and Science (BITS) Pilani', degree: 'Ph.D. Electrical & Robotics, IEEE Senior Member' },
  { first: 'Jaspreet', last: 'Kaur Bedi', affiliation: 'Lovely Professional University', degree: 'Ph.D. Pharmaceutical Chemistry, GPAT Qualified' },
  { first: 'Bhavna', last: 'Grewal', affiliation: 'Maharshi Dayanand University, Rohtak', degree: 'Ph.D. Education (Special & Inclusive Education), RCI Reg.' }
];

function generateSeedRequests(): IHiringRequest[] {
  const requests: IHiringRequest[] = [];
  let reqCounter = 1;

  function nextReqId(): string {
    const id = `REQ-2026-${String(reqCounter).padStart(3, '0')}`;
    reqCounter++;
    return id;
  }

  // Helper to pick rotating department specs
  let specIndex = 0;
  function getNextSpec() {
    const deptObj = DEPARTMENTS[specIndex % DEPARTMENTS.length];
    const spec = deptObj.specializations[(Math.floor(specIndex / DEPARTMENTS.length)) % deptObj.specializations.length];
    specIndex++;
    return { deptObj, spec };
  }

  // =========================================================================
  // STAGE 1: FRESH DEPARTMENT SUBMISSIONS (14 Requests: REQ-001 to REQ-014)
  // Status: 'Request Submitted (Department)', currentStage: 1
  // Awaiting Dean Academic scrutiny
  // =========================================================================
  for (let i = 0; i < 14; i++) {
    const { deptObj, spec } = getNextSpec();
    const reqId = nextReqId();
    requests.push({
      requestId: reqId,
      department: deptObj.name,
      postTitle: spec.postTitle,
      postLevel: spec.postLevel,
      employmentType: spec.employmentType,
      numberOfPositions: (i % 3 === 0) ? 2 : 1,
      justification: spec.justification,
      requiredQualifications: spec.qualifications,
      experienceRequired: spec.experience,
      tentativeBudget: spec.budget,
      budgetAmountNumber: spec.budgetNum,
      urgency: (i % 4 === 0) ? 'Urgent' : (i % 2 === 0 ? 'High' : 'Normal'),
      creator: {
        name: deptObj.deanName,
        role: 'Department / Dean',
        email: deptObj.deanEmail
      },
      status: 'Request Submitted (Department)',
      currentStage: 1,
      promotionChannels: [],
      totalPromotionCost: 0,
      candidates: [],
      comments: [
        {
          id: `comm-${reqId}-1`,
          authorName: deptObj.deanName,
          authorRole: 'Department / Dean',
          text: `Formal requisition submitted by Department of ${deptObj.name}. Teaching workload calculations and cadre requirement verified.`,
          timestamp: '2026-11-18T10:15:00.000Z',
          category: 'Remark'
        }
      ],
      auditTrail: [
        {
          id: `aud-${reqId}-1`,
          action: 'Requisition Created & Submitted',
          performedBy: deptObj.deanName,
          role: 'Department / Dean',
          details: `Requisition initiated for ${spec.postTitle} (${spec.postLevel}) by ${deptObj.deanName}.`,
          timestamp: '2026-11-18T10:15:00.000Z'
        }
      ],
      createdAt: '2026-11-18T10:15:00.000Z',
      updatedAt: '2026-11-18T10:15:00.000Z'
    });
  }

  // =========================================================================
  // STAGE 2: DEAN ACADEMIC SCRUTINY & CLARIFICATIONS (16 Requests: REQ-015 to REQ-030)
  // Sub-queues:
  // - 6 Fresh Under Review (Dean Academic)
  // - 7 Returned for Clarification (with active chat threads, 4 answered, 3 pending dept reply)
  // - 3 Rejected by Dean Academic (tests rejection history archive)
  // =========================================================================
  for (let i = 0; i < 16; i++) {
    const { deptObj, spec } = getNextSpec();
    const reqId = nextReqId();
    let status: HiringStatus = 'Under Review (Dean Academic)';
    let currentStage = 2;
    let deanApproval: IHiringRequest['deanAcademicApproval'] = undefined;
    let clarificationThreads: IHiringRequest['clarificationThreads'] = undefined;

    if (i < 6) {
      // Pending scrutiny in progress
      status = 'Under Review (Dean Academic)';
    } else if (i < 13) {
      // Returned for clarification with threaded conversation
      status = 'Returned for Clarification';
      const isAnswered = i % 2 === 0;
      clarificationThreads = [
        {
          id: `th-${reqId}-1`,
          subject: `Credit Hour & Laboratory Workload Verification - ${spec.postTitle}`,
          creatorName: 'Prof. (Dr.) Baljit Singh Khaira (Dean Academic)',
          creatorRole: 'Dean Academic',
          creatorEmail: 'dean.academic@gku.ac.in',
          primaryRecipientRole: 'Department / Dean',
          primaryRecipientEmail: deptObj.deanEmail,
          primaryRecipientName: deptObj.deanName,
          ccRecipients: [
            { name: 'Dr. Jagjeet Singh', email: 'registrar@gku.ac.in', role: 'VC / Registrar' }
          ],
          status: isAnswered ? 'Resolved' : 'Open',
          createdAt: '2026-11-12T14:30:00.000Z',
          updatedAt: isAnswered ? '2026-11-14T11:00:00.000Z' : '2026-11-12T14:30:00.000Z',
          messages: [
            {
              id: `msg-${reqId}-1`,
              senderName: 'Prof. (Dr.) Baljit Singh Khaira (Dean Academic)',
              senderRole: 'Dean Academic',
              senderEmail: 'dean.academic@gku.ac.in',
              text: `Kindly substantiate the credit hours distribution and state if visiting or adjunct faculty can absorb the current semester lecture load before sanctioning a permanent post.`,
              timestamp: '2026-11-12T14:30:00.000Z'
            },
            ...(isAnswered ? [{
              id: `msg-${reqId}-2`,
              senderName: deptObj.deanName,
              senderRole: 'Department / Dean',
              senderEmail: deptObj.deanEmail,
              text: `Visiting faculty is not permitted under the statutory regulatory norms for accreditation. The total departmental teaching load is 168 credit hours per week. A permanent appointment is essential.`,
              timestamp: '2026-11-14T11:00:00.000Z'
            }] : [])
          ]
        }
      ];
    } else {
      // Rejected by Dean Academic
      status = 'Rejected';
      deanApproval = {
        decision: 'Rejected',
        remarks: 'Department has adequate existing faculty strength as per UGC 1:20 norm. Recommend internal readjustment of tutorial batches.',
        decidedBy: 'Prof. (Dr.) Baljit Singh Khaira (Dean Academic)',
        decidedAt: '2026-11-10T16:00:00.000Z'
      };
    }

    requests.push({
      requestId: reqId,
      department: deptObj.name,
      postTitle: spec.postTitle,
      postLevel: spec.postLevel,
      employmentType: spec.employmentType,
      numberOfPositions: 1,
      justification: spec.justification,
      requiredQualifications: spec.qualifications,
      experienceRequired: spec.experience,
      tentativeBudget: spec.budget,
      budgetAmountNumber: spec.budgetNum,
      urgency: 'Normal',
      creator: {
        name: deptObj.deanName,
        role: 'Department / Dean',
        email: deptObj.deanEmail
      },
      status,
      currentStage,
      deanAcademicApproval: deanApproval,
      clarificationThreads,
      promotionChannels: [],
      totalPromotionCost: 0,
      candidates: [],
      comments: [
        {
          id: `comm-${reqId}-1`,
          authorName: deptObj.deanName,
          authorRole: 'Department / Dean',
          text: `Requisition submitted for academic evaluation.`,
          timestamp: '2026-11-10T09:00:00.000Z',
          category: 'Remark'
        }
      ],
      auditTrail: [
        {
          id: `aud-${reqId}-1`,
          action: 'Academic Scrutiny Initiated',
          performedBy: 'Prof. (Dr.) Baljit Singh Khaira (Dean Academic)',
          role: 'Dean Academic',
          details: `Dean Academic reviewed requisition. Current status: ${status}.`,
          timestamp: '2026-11-11T12:00:00.000Z'
        }
      ],
      createdAt: '2026-11-10T09:00:00.000Z',
      updatedAt: '2026-11-14T11:00:00.000Z'
    });
  }

  // =========================================================================
  // STAGE 3: VC / REGISTRAR ADMINISTRATIVE SANCTIONS (16 Requests: REQ-031 to REQ-046)
  // Sub-queues:
  // - 8 Cleared by Dean Academic, Awaiting VC Decision (Tab 1)
  // - 5 VC Clarification Hold (with executive queries regarding budget / syndicate)
  // - 3 VC Rejected (administrative budget freeze or roster re-allotment)
  // =========================================================================
  for (let i = 0; i < 16; i++) {
    const { deptObj, spec } = getNextSpec();
    const reqId = nextReqId();
    let status: HiringStatus = 'Approved by Dean Academic';
    let currentStage = 3;
    let vcApproval: IHiringRequest['vcRegistrarApproval'] = undefined;
    let clarificationThreads: IHiringRequest['clarificationThreads'] = undefined;

    const deanApproval = {
      decision: 'Approved' as const,
      remarks: 'Verified curriculum compliance, workload calculations, and faculty cadre ratio. Recommended for executive sanction.',
      decidedBy: 'Prof. (Dr.) Baljit Singh Khaira (Dean Academic)',
      decidedAt: '2026-11-05T14:00:00.000Z'
    };

    if (i < 8) {
      // Ready for VC Decision
      status = 'Approved by Dean Academic';
    } else if (i < 13) {
      // VC in clarification hold
      status = 'Returned for Clarification';
      const isAnswered = i % 2 === 1;
      clarificationThreads = [
        {
          id: `th-${reqId}-vc-1`,
          subject: `Syndicate Financial Sanction & Reservation Roster - ${spec.postTitle}`,
          creatorName: 'Dr. Jagjeet Singh (Registrar)',
          creatorRole: 'VC / Registrar',
          creatorEmail: 'registrar@gku.ac.in',
          primaryRecipientRole: 'Dean Academic',
          primaryRecipientEmail: 'dean.academic@gku.ac.in',
          primaryRecipientName: 'Prof. (Dr.) Baljit Singh Khaira (Dean Academic)',
          ccRecipients: [
            { name: deptObj.deanName, email: deptObj.deanEmail, role: 'Department / Dean' }
          ],
          status: isAnswered ? 'Resolved' : 'Open',
          createdAt: '2026-11-06T15:00:00.000Z',
          updatedAt: isAnswered ? '2026-11-08T10:00:00.000Z' : '2026-11-06T15:00:00.000Z',
          messages: [
            {
              id: `msg-${reqId}-vc-1`,
              senderName: 'Dr. Jagjeet Singh (Registrar)',
              senderRole: 'VC / Registrar',
              senderEmail: 'registrar@gku.ac.in',
              text: `Please confirm 200-point reservation roster slot and whether budget is provided under University recurring grants or self-financed scheme.`,
              timestamp: '2026-11-06T15:00:00.000Z'
            },
            ...(isAnswered ? [{
              id: `msg-${reqId}-vc-2`,
              senderName: 'Prof. (Dr.) Baljit Singh Khaira (Dean Academic)',
              senderRole: 'Dean Academic',
              senderEmail: 'dean.academic@gku.ac.in',
              text: `Slot corresponds to Roster Point #14 (Unreserved / Open). Budget is covered under Department tuition fee revenue allocations.`,
              timestamp: '2026-11-08T10:00:00.000Z'
            }] : [])
          ]
        }
      ];
    } else {
      // VC Rejected
      status = 'Rejected';
      vcApproval = {
        decision: 'Rejected',
        remarks: 'Postponed to next financial year as per University Finance Committee austerity guidelines.',
        decidedBy: 'Prof. (Dr.) Harpreet Singh (Vice Chancellor)',
        decidedAt: '2026-11-07T11:00:00.000Z'
      };
    }

    requests.push({
      requestId: reqId,
      department: deptObj.name,
      postTitle: spec.postTitle,
      postLevel: spec.postLevel,
      employmentType: spec.employmentType,
      numberOfPositions: 1,
      justification: spec.justification,
      requiredQualifications: spec.qualifications,
      experienceRequired: spec.experience,
      tentativeBudget: spec.budget,
      budgetAmountNumber: spec.budgetNum,
      urgency: 'Normal',
      creator: {
        name: deptObj.deanName,
        role: 'Department / Dean',
        email: deptObj.deanEmail
      },
      status,
      currentStage,
      deanAcademicApproval: deanApproval,
      vcRegistrarApproval: vcApproval,
      clarificationThreads,
      promotionChannels: [],
      totalPromotionCost: 0,
      candidates: [],
      comments: [
        {
          id: `comm-${reqId}-1`,
          authorName: 'Prof. (Dr.) Baljit Singh Khaira (Dean Academic)',
          authorRole: 'Dean Academic',
          text: `Cleared by Academic Council Scrutiny Cell. Forwarded to Vice Chancellor for sanction.`,
          timestamp: '2026-11-05T14:00:00.000Z',
          category: 'Remark'
        }
      ],
      auditTrail: [
        {
          id: `aud-${reqId}-1`,
          action: 'Academic Approval Granted',
          performedBy: 'Prof. (Dr.) Baljit Singh Khaira (Dean Academic)',
          role: 'Dean Academic',
          details: `Requisition approved by Dean Academic and routed to VC / Registrar desk.`,
          timestamp: '2026-11-05T14:00:00.000Z'
        }
      ],
      createdAt: '2026-11-02T10:00:00.000Z',
      updatedAt: '2026-11-08T10:00:00.000Z'
    });
  }

  // =========================================================================
  // STAGE 4: HR TALENT ACQUISITION (24 Requests: REQ-047 to REQ-070)
  // Sub-queues:
  // - 10 Approved for Posting (HR Tab 1: Approved by VC, waiting for media channels to be configured)
  // - 14 Active Posted Jobs (HR Tab 2: Live on portals, media costs logged, receiving & screening resumes)
  // =========================================================================
  for (let i = 0; i < 24; i++) {
    const { deptObj, spec } = getNextSpec();
    const reqId = nextReqId();
    const isAlreadyPosted = i >= 10; // First 10 in Tab 1, next 14 in Tab 2

    const deanApproval = {
      decision: 'Approved' as const,
      remarks: 'Verified requirement. Recommended for immediate recruitment.',
      decidedBy: 'Prof. (Dr.) Baljit Singh Khaira (Dean Academic)',
      decidedAt: '2026-10-15T11:00:00.000Z'
    };

    const vcApproval = {
      decision: 'Approved' as const,
      remarks: 'Sanction approved as per University Syndicate resolution 7.3. HR to initiate media releases.',
      decidedBy: 'Dr. Jagjeet Singh (Registrar)',
      decidedAt: '2026-10-18T16:00:00.000Z'
    };

    let promotionChannels: IHiringRequest['promotionChannels'] = [];
    let totalCost = 0;
    let candidates: IHiringRequest['candidates'] = [];
    let status: HiringStatus = 'Approved by VC / Registrar';

    if (isAlreadyPosted) {
      status = 'In Process (HR - Recruitment)';
      promotionChannels = [
        {
          id: `prom-${reqId}-1`,
          channelName: 'Guru Kashi University Official Career Portal',
          cost: 0,
          postDate: '2026-10-20',
          expiryDate: '2026-12-10',
          urlOrRef: `https://gurukashiuniversity.in/careers/${reqId.toLowerCase()}`,
          notes: 'Standard university portal posting'
        },
        {
          id: `prom-${reqId}-2`,
          channelName: (i % 2 === 0) ? 'Times Ascent (Print & Digital)' : 'LinkedIn Talent Solutions',
          cost: (i % 2 === 0) ? 35000 : 18000,
          postDate: '2026-10-22',
          expiryDate: '2026-11-28',
          urlOrRef: (i % 2 === 0) ? 'TA-PUN-OCT-2026' : 'LI-GKU-FACULTY-POST',
          notes: 'National newspaper and digital circulation'
        }
      ];
      totalCost = promotionChannels.reduce((sum, ch) => sum + ch.cost, 0);

      // Add 1-3 applied candidates awaiting screening
      const numCands = (i % 3) + 1;
      for (let c = 0; c < numCands; c++) {
        const candData = CANDIDATE_NAMES[(i + c) % CANDIDATE_NAMES.length];
        candidates.push({
          id: `cand-${reqId}-${c + 1}`,
          fullName: `Dr. ${candData.first} ${candData.last}`,
          email: `${candData.first.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
          phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
          currentAffiliation: candData.affiliation,
          qualification: candData.degree,
          experienceYears: 4 + (c * 2),
          resumeFileName: `CV_${candData.first.replace(/[^a-zA-Z]/g, '')}_${candData.last}.pdf`,
          status: 'Applied'
        });
      }
    }

    requests.push({
      requestId: reqId,
      department: deptObj.name,
      postTitle: spec.postTitle,
      postLevel: spec.postLevel,
      employmentType: spec.employmentType,
      numberOfPositions: (i % 4 === 0) ? 2 : 1,
      justification: spec.justification,
      requiredQualifications: spec.qualifications,
      experienceRequired: spec.experience,
      tentativeBudget: spec.budget,
      budgetAmountNumber: spec.budgetNum,
      urgency: 'Normal',
      creator: {
        name: deptObj.deanName,
        role: 'Department / Dean',
        email: deptObj.deanEmail
      },
      status,
      currentStage: 4,
      deanAcademicApproval: deanApproval,
      vcRegistrarApproval: vcApproval,
      promotionChannels,
      totalPromotionCost: totalCost,
      candidates,
      comments: [
        {
          id: `comm-${reqId}-1`,
          authorName: 'Dr. Jaswinder Kaur (HR Director)',
          authorRole: 'HR Department',
          text: isAlreadyPosted
            ? `Media release published on University Portal & national employment channels. Applications being received.`
            : `Sanction received from Registrar. Preparing advertisement creative and scheduling media release.`,
          timestamp: '2026-10-20T10:00:00.000Z',
          category: 'Remark'
        }
      ],
      auditTrail: [
        {
          id: `aud-${reqId}-1`,
          action: isAlreadyPosted ? 'Advertisement Released' : 'Sanction Recorded in HR',
          performedBy: 'Dr. Jaswinder Kaur (HR Director)',
          role: 'HR Department',
          details: isAlreadyPosted
            ? `Job posting activated across ${promotionChannels.length} media channels.`
            : 'Requisition entered in HR Talent Acquisition pipeline.',
          timestamp: '2026-10-20T10:00:00.000Z'
        }
      ],
      createdAt: '2026-10-12T09:00:00.000Z',
      updatedAt: '2026-10-22T14:00:00.000Z'
    });
  }

  // =========================================================================
  // STAGE 5: SELECTION PANEL INTERVIEWS & CANDIDATE SCORING (20 Requests: REQ-071 to REQ-090)
  // Appears in HR Tab 3: Scheduled Interviews
  // Contains candidates in 'Interview Scheduled' and 'Interviewed' with score breakdown:
  // - Subject Knowledge (40)
  // - Research Publications (25)
  // - Teaching Aptitude (20)
  // - Communication (15)
  // Total Score (100) -> Ready for panel to Shortlist or Reject
  // =========================================================================
  for (let i = 0; i < 20; i++) {
    const { deptObj, spec } = getNextSpec();
    const reqId = nextReqId();

    const deanApproval = {
      decision: 'Approved' as const,
      remarks: 'Approved by Dean Academic.',
      decidedBy: 'Prof. (Dr.) Baljit Singh Khaira (Dean Academic)',
      decidedAt: '2026-09-25T10:00:00.000Z'
    };

    const vcApproval = {
      decision: 'Approved' as const,
      remarks: 'Sanction approved. Constitute selection committee as per UGC guidelines.',
      decidedBy: 'Prof. (Dr.) Harpreet Singh (Vice Chancellor)',
      decidedAt: '2026-09-28T15:00:00.000Z'
    };

    const promotionChannels = [
      {
        id: `prom-${reqId}-1`,
        channelName: 'University Careers Portal',
        cost: 0,
        postDate: '2026-10-01',
        expiryDate: '2026-11-15',
        urlOrRef: `https://gurukashiuniversity.in/careers/${reqId.toLowerCase()}`,
        notes: 'Portal listing'
      },
      {
        id: `prom-${reqId}-2`,
        channelName: 'Times Ascent / UGC Career News',
        cost: 25000,
        postDate: '2026-10-01',
        expiryDate: '2026-11-15',
        urlOrRef: 'UGC-CAREER-REF-891',
        notes: 'National circulation'
      }
    ];

    // Build candidates for this interview pipeline
    const candidates: IHiringRequest['candidates'] = [];
    const cand1 = CANDIDATE_NAMES[(i * 2) % CANDIDATE_NAMES.length];
    const cand2 = CANDIDATE_NAMES[(i * 2 + 1) % CANDIDATE_NAMES.length];

    if (i % 2 === 0) {
      // Cand 1 has been interviewed & scored (ready for shortlisting)
      // Cand 2 has interview scheduled
      const subj = 34 + (i % 6);
      const res = 20 + (i % 5);
      const teach = 16 + (i % 4);
      const comm = 12 + (i % 3);
      const total = subj + res + teach + comm;

      candidates.push({
        id: `cand-${reqId}-1`,
        fullName: `Dr. ${cand1.first} ${cand1.last}`,
        email: `${cand1.first.toLowerCase().replace(/[^a-z]/g, '')}@gmail.com`,
        phone: `+91 94${Math.floor(10000000 + Math.random() * 90000000)}`,
        currentAffiliation: cand1.affiliation,
        qualification: cand1.degree,
        experienceYears: 6 + (i % 7),
        resumeFileName: `CV_${cand1.first}_${cand1.last}.pdf`,
        status: 'Interviewed',
        interviewDetails: {
          date: '2026-11-18',
          panelMembers: [
            'Prof. (Dr.) Harpreet Singh (Vice Chancellor - Chair)',
            'Prof. (Dr.) Baljit Singh Khaira (Dean Academic)',
            `Dr. ${deptObj.deanName} (Dean of Faculty)`,
            'External Subject Expert (PAU / PU / IIT)'
          ],
          scores: {
            subjectKnowledge: subj,
            researchPublications: res,
            teachingAptitude: teach,
            communication: comm,
            totalScore: total
          },
          panelRemarks: `Eminent academician with strong instructional delivery and proven peer-reviewed research record. Scored ${total}/100.`,
          recommendation: total >= 80 ? 'Strongly Recommend' : 'Recommend'
        }
      });

      candidates.push({
        id: `cand-${reqId}-2`,
        fullName: `Dr. ${cand2.first} ${cand2.last}`,
        email: `${cand2.first.toLowerCase().replace(/[^a-z]/g, '')}@gmail.com`,
        phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
        currentAffiliation: cand2.affiliation,
        qualification: cand2.degree,
        experienceYears: 4 + (i % 4),
        resumeFileName: `CV_${cand2.first}_${cand2.last}.pdf`,
        status: 'Interview Scheduled',
        interviewDetails: {
          date: '2026-11-26',
          panelMembers: [
            'Vice Chancellor',
            'Dean Academic',
            'Dean of Faculty',
            'External Expert'
          ],
          scores: {
            subjectKnowledge: 0,
            researchPublications: 0,
            teachingAptitude: 0,
            communication: 0,
            totalScore: 0
          },
          panelRemarks: 'Scheduled for presentation and committee interview in Board Room 1.',
          recommendation: 'Recommend'
        }
      });
    } else {
      // Both candidates scheduled
      candidates.push({
        id: `cand-${reqId}-1`,
        fullName: `Dr. ${cand1.first} ${cand1.last}`,
        email: `${cand1.first.toLowerCase().replace(/[^a-z]/g, '')}@gmail.com`,
        phone: `+91 97${Math.floor(10000000 + Math.random() * 90000000)}`,
        currentAffiliation: cand1.affiliation,
        qualification: cand1.degree,
        experienceYears: 5,
        resumeFileName: `CV_${cand1.first}_${cand1.last}.pdf`,
        status: 'Interview Scheduled',
        interviewDetails: {
          date: '2026-11-27',
          panelMembers: ['Vice Chancellor', 'Dean Academic', 'Subject Expert'],
          scores: { subjectKnowledge: 0, researchPublications: 0, teachingAptitude: 0, communication: 0, totalScore: 0 },
          panelRemarks: 'Interview slot confirmed for Syndicate Hall.',
          recommendation: 'Recommend'
        }
      });
    }

    requests.push({
      requestId: reqId,
      department: deptObj.name,
      postTitle: spec.postTitle,
      postLevel: spec.postLevel,
      employmentType: spec.employmentType,
      numberOfPositions: 1,
      justification: spec.justification,
      requiredQualifications: spec.qualifications,
      experienceRequired: spec.experience,
      tentativeBudget: spec.budget,
      budgetAmountNumber: spec.budgetNum,
      urgency: 'Normal',
      creator: {
        name: deptObj.deanName,
        role: 'Department / Dean',
        email: deptObj.deanEmail
      },
      status: 'In Process (HR - Recruitment)',
      currentStage: 4,
      deanAcademicApproval: deanApproval,
      vcRegistrarApproval: vcApproval,
      promotionChannels,
      totalPromotionCost: 25000,
      candidates,
      comments: [
        {
          id: `comm-${reqId}-1`,
          authorName: 'Dr. Jaswinder Kaur (HR Director)',
          authorRole: 'HR Department',
          text: `Selection Committee dates notified to candidates and panel members. Interview assessment sheets issued.`,
          timestamp: '2026-10-25T11:00:00.000Z',
          category: 'Remark'
        }
      ],
      auditTrail: [
        {
          id: `aud-${reqId}-1`,
          action: 'Interviews Scheduled & Convened',
          performedBy: 'Dr. Jaswinder Kaur (HR Director)',
          role: 'HR Department',
          details: `Statutory Selection Panel convened for ${spec.postTitle}.`,
          timestamp: '2026-10-25T11:00:00.000Z'
        }
      ],
      createdAt: '2026-09-20T10:00:00.000Z',
      updatedAt: '2026-11-18T16:00:00.000Z'
    });
  }

  // =========================================================================
  // STAGE 6: FORMAL OFFERS, APPOINTMENT WORKBENCH & INDUCTION (14 Requests: REQ-091 to REQ-104)
  // Appears in HR Tab 4: Shortlisted & Offer Letters
  // Covers:
  // - Candidates in 'Selected' state (Ready to generate offer in Full-Page Workbench)
  // - Candidates in 'Offer Issued' state (Offer Ref, Salary, Pre-Joining Document Verification Desk with files)
  // - Candidates in 'Joined' state (Induction checklist verified, Employee ID generated)
  // =========================================================================
  for (let i = 0; i < 14; i++) {
    const { deptObj, spec } = getNextSpec();
    const reqId = nextReqId();

    const deanApproval = {
      decision: 'Approved' as const,
      remarks: 'Recommended for immediate recruitment.',
      decidedBy: 'Prof. (Dr.) Baljit Singh Khaira (Dean Academic)',
      decidedAt: '2026-09-01T10:00:00.000Z'
    };

    const vcApproval = {
      decision: 'Approved' as const,
      remarks: 'Sanction approved. Issue formal letter of appointment upon selection.',
      decidedBy: 'Prof. (Dr.) Harpreet Singh (Vice Chancellor)',
      decidedAt: '2026-09-05T14:00:00.000Z'
    };

    const promotionChannels = [
      {
        id: `prom-${reqId}-1`,
        channelName: 'University Portal & National Press',
        cost: 32000,
        postDate: '2026-09-10',
        expiryDate: '2026-10-20',
        urlOrRef: `GKU/ADV/2026/${reqId}`,
        notes: 'National circulation completed'
      }
    ];

    const candData = CANDIDATE_NAMES[i % CANDIDATE_NAMES.length];
    const candidateId = `cand-${reqId}-1`;

    let candStatus: IHiringRequest['candidates'][0]['status'] = 'Selected';
    let joiningDetails: IHiringRequest['candidates'][0]['joiningDetails'] = undefined;

    if (i < 4) {
      // 1. Selected (Ready for Offer Letter Workbench)
      candStatus = 'Selected';
    } else if (i < 9) {
      // 2. Offer Issued (With Document Verification Desk)
      candStatus = 'Offer Issued';
      joiningDetails = {
        offerLetterRef: `GKU/EST/OFFER/2026/${String(100 + i)}`,
        offerLetterDate: '2026-10-25',
        offeredCtc: `₹${(spec.budgetNum / 100000).toFixed(2)} Lakhs p.a.`,
        basicSalary: `₹${Math.floor(spec.budgetNum / 12 * 0.65).toLocaleString('en-IN')} p.m.`,
        academicLevel: spec.postLevel,
        probationPeriod: '1 Year',
        joiningDeadline: '2026-12-15',
        offerRemarks: 'Approved by Vice Chancellor and Syndicate. 1-year probation with university accommodation eligibility.',
        offerLetterFile: `Appointment_Letter_${candData.first}_${candData.last}.pdf`,
        signedOfferLetterCopy: `Countersigned_Acceptance_${candData.last}.pdf`,
        documentVerification: {
          identityProof: true,
          degreesVerified: true,
          experienceCertificates: true,
          policeVerification: true,
          medicalFitness: i % 2 === 0,
          nocRelieving: i % 2 === 0,
          verificationRemarks: 'Identity (Aadhaar/PAN), Doctorate degrees, and previous institution experience verified by Registrar office.',
          uploadedFiles: {
            identityProof: {
              fileName: `Aadhaar_PAN_Copy_${candData.last}.pdf`,
              fileSize: '1.2 MB',
              uploadedAt: '2026-10-26',
              category: 'Identity Proof'
            },
            degreesVerified: {
              fileName: `Ph.D._M.Tech_Degrees_${candData.last}.pdf`,
              fileSize: '3.8 MB',
              uploadedAt: '2026-10-26',
              category: 'Degree Certificates'
            },
            experienceCertificates: {
              fileName: `Experience_Relieving_Letters.pdf`,
              fileSize: '2.1 MB',
              uploadedAt: '2026-10-27',
              category: 'Experience Letters'
            },
            policeVerification: {
              fileName: `Police_Clearance_Certificate.pdf`,
              fileSize: '890 KB',
              uploadedAt: '2026-10-28',
              category: 'Police Verification'
            }
          }
        },
        inductionCompleted: false
      };
    } else {
      // 3. Joined & Inducted
      candStatus = 'Joined';
      joiningDetails = {
        offerLetterRef: `GKU/EST/OFFER/2026/${String(100 + i)}`,
        offerLetterDate: '2026-10-05',
        offeredCtc: `₹${(spec.budgetNum / 100000).toFixed(2)} Lakhs p.a.`,
        basicSalary: `₹${Math.floor(spec.budgetNum / 12 * 0.65).toLocaleString('en-IN')} p.m.`,
        academicLevel: spec.postLevel,
        probationPeriod: '1 Year',
        joiningDeadline: '2026-11-01',
        offerRemarks: 'Offer accepted. Official joining report received and ratified.',
        offerLetterFile: `Appointment_Letter_${candData.first}_${candData.last}.pdf`,
        signedOfferLetterCopy: `Signed_Acceptance_${candData.last}.pdf`,
        documentVerification: {
          identityProof: true,
          degreesVerified: true,
          experienceCertificates: true,
          policeVerification: true,
          medicalFitness: true,
          nocRelieving: true,
          verificationRemarks: 'All 6 compliance criteria verified. Full clearance granted by Registrar Office.',
          uploadedFiles: {
            identityProof: { fileName: `Aadhaar_PAN_${candData.last}.pdf`, fileSize: '1.1 MB', uploadedAt: '2026-10-08', category: 'Identity Proof' },
            degreesVerified: { fileName: `Doctorate_Degree_Verification.pdf`, fileSize: '3.2 MB', uploadedAt: '2026-10-08', category: 'Degree Certificates' },
            experienceCertificates: { fileName: `Service_Record_Relieving.pdf`, fileSize: '2.4 MB', uploadedAt: '2026-10-09', category: 'Experience Letters' },
            policeVerification: { fileName: `Police_Verification_Report.pdf`, fileSize: '950 KB', uploadedAt: '2026-10-10', category: 'Police Verification' }
          }
        },
        inductionCompleted: true,
        inductionChecklist: {
          idCardIssued: true,
          itAccountCreated: true,
          workloadAssigned: true,
          bankAccountOpened: true
        },
        joiningDate: '2026-11-01',
        employeeId: `GKU-FAC-2026-${String(40 + i)}`,
        officialEmail: `dr.${candData.first.toLowerCase().replace(/[^a-z]/g, '')}@gku.ac.in`,
        reportingHead: deptObj.deanName,
        joiningRemarks: 'Candidate assumed charge on 1st November 2026. Official departmental orientation and classroom assignment finalized.'
      };
    }

    const candidateRecord: IHiringRequest['candidates'][0] = {
      id: candidateId,
      fullName: `Dr. ${candData.first} ${candData.last}`,
      email: `${candData.first.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
      phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
      currentAffiliation: candData.affiliation,
      qualification: candData.degree,
      experienceYears: 7 + (i % 5),
      resumeFileName: `CV_${candData.first}_${candData.last}.pdf`,
      status: candStatus,
      interviewDetails: {
        date: '2026-10-10',
        panelMembers: [
          'Prof. (Dr.) Harpreet Singh (Vice Chancellor - Chair)',
          'Prof. (Dr.) Baljit Singh Khaira (Dean Academic)',
          `Dr. ${deptObj.deanName} (Dean of Faculty)`,
          'External University Subject Expert'
        ],
        scores: {
          subjectKnowledge: 38,
          researchPublications: 24,
          teachingAptitude: 19,
          communication: 14,
          totalScore: 95
        },
        panelRemarks: `Selected unanimously by Statutory Selection Committee. Outstanding academic scholarship and vision.`,
        recommendation: 'Strongly Recommend'
      },
      joiningDetails
    };

    requests.push({
      requestId: reqId,
      department: deptObj.name,
      postTitle: spec.postTitle,
      postLevel: spec.postLevel,
      employmentType: spec.employmentType,
      numberOfPositions: 1,
      justification: spec.justification,
      requiredQualifications: spec.qualifications,
      experienceRequired: spec.experience,
      tentativeBudget: spec.budget,
      budgetAmountNumber: spec.budgetNum,
      urgency: 'Normal',
      creator: {
        name: deptObj.deanName,
        role: 'Department / Dean',
        email: deptObj.deanEmail
      },
      status: 'Interview & Selection Completed',
      currentStage: 5,
      deanAcademicApproval: deanApproval,
      vcRegistrarApproval: vcApproval,
      promotionChannels,
      totalPromotionCost: 32000,
      candidates: [candidateRecord],
      comments: [
        {
          id: `comm-${reqId}-1`,
          authorName: 'Dr. Jaswinder Kaur (HR Director)',
          authorRole: 'HR Department',
          text: `Selection panel proceedings approved by Vice Chancellor. Candidate dossier moved to appointment desk.`,
          timestamp: '2026-10-12T10:00:00.000Z',
          category: 'Remark'
        }
      ],
      auditTrail: [
        {
          id: `aud-${reqId}-1`,
          action: 'Candidate Selected for Appointment',
          performedBy: 'Dr. Jaswinder Kaur (HR Director)',
          role: 'HR Department',
          details: `Candidate Dr. ${candData.first} ${candData.last} selected with total score 95/100. Current status: ${candStatus}.`,
          timestamp: '2026-10-12T10:00:00.000Z'
        }
      ],
      createdAt: '2026-08-28T10:00:00.000Z',
      updatedAt: '2026-11-02T12:00:00.000Z'
    });
  }

  // =========================================================================
  // STAGE 7: ARCHIVES & RECORDS CABINET (36 Requests across all 12 Departments)
  // Appears in HR Tab 6: Archives & Records Cabinet (Department Filing System)
  // 3 distinct archived drives per department folder:
  // - Drive 1: Position Fulfilled (Recruitment Completed) - With appointed faculty, employee ID, verified docs
  // - Drive 2: Applications Closed (Intake Stopped) - With closure remarks & screened candidate
  // - Drive 3: Hiring On Hold - With paused remarks & syndicate directive
  // =========================================================================
  for (let d = 0; d < DEPARTMENTS.length; d++) {
    const deptObj = DEPARTMENTS[d];
    const statusCycle: HiringStatus[] = [
      'Position Fulfilled (Recruitment Completed)',
      'Applications Closed (Intake Stopped)',
      'Hiring On Hold'
    ];

    for (let s = 0; s < Math.min(3, deptObj.specializations.length); s++) {
      const spec = deptObj.specializations[s];
      const reqId = nextReqId();
      const archiveStatus = statusCycle[s % statusCycle.length];

      const deanApproval = {
        decision: 'Approved' as const,
        remarks: 'Requisition verified and endorsed.',
        decidedBy: 'Prof. (Dr.) Baljit Singh Khaira (Dean Academic)',
        decidedAt: '2026-07-10T10:00:00.000Z'
      };

      const vcApproval = {
        decision: 'Approved' as const,
        remarks: 'Sanction approved by Vice Chancellor.',
        decidedBy: 'Prof. (Dr.) Harpreet Singh (Vice Chancellor)',
        decidedAt: '2026-07-15T15:00:00.000Z'
      };

      const candData = CANDIDATE_NAMES[(d * 3 + s) % CANDIDATE_NAMES.length];

      const candidates: IHiringRequest['candidates'] = [
        {
          id: `cand-${reqId}-arch`,
          fullName: `Dr. ${candData.first} ${candData.last}`,
          email: `${candData.first.toLowerCase().replace(/[^a-z]/g, '')}@gmail.com`,
          phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
          currentAffiliation: candData.affiliation,
          qualification: candData.degree,
          experienceYears: 8,
          resumeFileName: `CV_${candData.first}_${candData.last}.pdf`,
          status: archiveStatus === 'Hiring On Hold' || archiveStatus === 'Applications Closed (Intake Stopped)'
            ? 'Shortlisted'
            : 'Joined',
          interviewDetails: {
            date: '2026-08-15',
            panelMembers: ['Vice Chancellor', 'Dean Academic', 'Subject Expert'],
            scores: { subjectKnowledge: 36, researchPublications: 23, teachingAptitude: 18, communication: 14, totalScore: 91 },
            panelRemarks: 'Highly qualified candidate for the department.',
            recommendation: 'Strongly Recommend'
          },
          joiningDetails: {
            offerLetterRef: `GKU/EST/OFFER/2026/ARC-${100 + (d * 3 + s)}`,
            offerLetterDate: '2026-08-20',
            offeredCtc: `₹${(spec.budgetNum / 100000).toFixed(2)} Lakhs p.a.`,
            basicSalary: `₹${Math.floor(spec.budgetNum / 12 * 0.65).toLocaleString('en-IN')} p.m.`,
            academicLevel: spec.postLevel,
            probationPeriod: '1 Year',
            joiningDeadline: '2026-09-15',
            offerRemarks: 'Archived appointment record.',
            offerLetterFile: `Appointment_Letter_Archived_${candData.last}.pdf`,
            signedOfferLetterCopy: `Signed_Acceptance_Copy.pdf`,
            documentVerification: {
              identityProof: true,
              degreesVerified: true,
              experienceCertificates: true,
              policeVerification: true,
              medicalFitness: true,
              nocRelieving: true,
              verificationRemarks: 'Archival compliance verification complete.',
              uploadedFiles: {
                identityProof: { fileName: `Aadhaar_Verified_${candData.last}.pdf`, fileSize: '1.2 MB', uploadedAt: '2026-08-22', category: 'Identity Proof' },
                degreesVerified: { fileName: `Ph.D._Degree_Certificate.pdf`, fileSize: '3.1 MB', uploadedAt: '2026-08-22', category: 'Degree Certificates' }
              }
            },
            inductionCompleted: archiveStatus === 'Position Fulfilled (Recruitment Completed)',
            joiningDate: '2026-09-10',
            employeeId: `GKU-FAC-2026-ARC${String(d * 3 + s + 1).padStart(2, '0')}`,
            officialEmail: `dr.${candData.first.toLowerCase().replace(/[^a-z]/g, '')}@gku.ac.in`,
            reportingHead: deptObj.deanName,
            joiningRemarks: 'Inducted and active faculty member. Archived to department records cabinet.'
          }
        }
      ];

      requests.push({
        requestId: reqId,
        department: deptObj.name,
        postTitle: spec.postTitle,
        postLevel: spec.postLevel,
        employmentType: spec.employmentType,
        numberOfPositions: 1,
        justification: spec.justification,
        requiredQualifications: spec.qualifications,
        experienceRequired: spec.experience,
        tentativeBudget: spec.budget,
        budgetAmountNumber: spec.budgetNum,
        urgency: 'Normal',
        creator: {
          name: deptObj.deanName,
          role: 'Department / Dean',
          email: deptObj.deanEmail
        },
        status: archiveStatus,
        currentStage: 6,
        deanAcademicApproval: deanApproval,
        vcRegistrarApproval: vcApproval,
        promotionChannels: [
          {
            id: `prom-${reqId}-arch`,
            channelName: 'University Careers Archive',
            cost: 15000,
            postDate: '2026-08-01',
            expiryDate: '2026-09-01',
            urlOrRef: `GKU/ARCHIVE/${reqId}`,
            notes: 'Archived recruitment drive'
          }
        ],
        totalPromotionCost: 15000,
        candidates,
        comments: [
          {
            id: `comm-${reqId}-arch`,
            authorName: 'Dr. Jaswinder Kaur (HR Director)',
            authorRole: 'HR Department',
            text: `Recruitment drive finalized. Status marked as "${archiveStatus}". Transferred to Department Records Cabinet.`,
            timestamp: '2026-09-12T14:00:00.000Z',
            category: 'Remark'
          }
        ],
        auditTrail: [
          {
            id: `aud-${reqId}-arch`,
            action: 'Dossier Filed in Archives Cabinet',
            performedBy: 'Dr. Jaswinder Kaur (HR Director)',
            role: 'HR Department',
            details: `Requisition filed under ${deptObj.name} records folder with status ${archiveStatus}.`,
            timestamp: '2026-09-12T14:00:00.000Z'
          }
        ],
        createdAt: '2026-07-01T10:00:00.000Z',
        updatedAt: '2026-09-12T14:00:00.000Z'
      });
    }
  }

  return requests;
}

export async function POST() {
  try {
    await connectToDatabase();

    // Clear existing data and reseed with comprehensive real university recruitment records
    await HiringRequestModel.deleteMany({});

    const initialRequests = generateSeedRequests();
    const result = await HiringRequestModel.insertMany(initialRequests);

    return NextResponse.json({
      success: true,
      message: `Database successfully reseeded with ${result.length} comprehensive recruitment records across all 12 Guru Kashi University departments and governance stages.`,
      count: result.length,
      stages: {
        stage1DepartmentSubmitted: 14,
        stage2DeanAcademicScrutiny: 16,
        stage3VCRegistrarSanctions: 16,
        stage4HRMediaPosting: 24,
        stage5InterviewScoring: 20,
        stage6OffersWorkbench: 14,
        stage7ArchivesCabinet: 36,
        total: result.length
      }
    });
  } catch (error: any) {
    console.error('Seed Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed database' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Support seeding via GET for quick browser verification
  return POST();
}
