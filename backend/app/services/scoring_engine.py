from typing import Dict, Any, List

# Standard career benchmarks
CAREER_BENCHMARKS = {
    "AI Systems Architect": {
        "weights": {"architecture": 0.30, "ai_ml": 0.40, "cloud_devops": 0.15, "security": 0.15},
        "critical_skills": ["Python", "PyTorch", "LLM Orchestration", "Vector Databases", "System Design"],
    },
    "Cloud Full-Stack Engineer": {
        "weights": {"architecture": 0.25, "ai_ml": 0.15, "cloud_devops": 0.35, "web_frontend": 0.25},
        "critical_skills": ["TypeScript", "React", "Next.js", "Docker", "PostgreSQL"],
    },
    "DevSecOps & Platform Engineer": {
        "weights": {"cloud_devops": 0.45, "security": 0.35, "architecture": 0.20},
        "critical_skills": ["Kubernetes", "CI/CD", "Zero-Trust", "Infrastructure as Code", "Go"],
    },
    "Autonomous Agent Engineer": {
        "weights": {"ai_ml": 0.45, "architecture": 0.30, "web_frontend": 0.15, "cloud_devops": 0.10},
        "critical_skills": ["Multi-Agent Runtimes", "Function Calling", "Streaming LLMs", "Python"],
    }
}


def calculate_assessment_scores(answers: Dict[str, Any]) -> Dict[str, Any]:
    """
    Scoring engine that evaluates user answers across categorical domains
    and computes overall career compatibility scores and skill gap analysis.
    """
    # Category score accumulator
    category_totals = {
        "architecture": 0.0,
        "ai_ml": 0.0,
        "cloud_devops": 0.0,
        "web_frontend": 0.0,
        "security": 0.0
    }
    category_counts = {k: 0 for k in category_totals}

    # Evaluate question answers
    for q_id, val in answers.items():
        score = float(val) if isinstance(val, (int, float)) else 3.0  # scale 1-5
        normalized = (score / 5.0) * 100.0

        if "arch" in q_id:
            category_totals["architecture"] += normalized
            category_counts["architecture"] += 1
        elif "ai" in q_id or "ml" in q_id:
            category_totals["ai_ml"] += normalized
            category_counts["ai_ml"] += 1
        elif "cloud" in q_id or "ops" in q_id:
            category_totals["cloud_devops"] += normalized
            category_counts["cloud_devops"] += 1
        elif "web" in q_id or "front" in q_id:
            category_totals["web_frontend"] += normalized
            category_counts["web_frontend"] += 1
        elif "sec" in q_id:
            category_totals["security"] += normalized
            category_counts["security"] += 1

    # Calculate average per category
    category_averages = {}
    for cat, total in category_totals.items():
        cnt = category_counts[cat]
        category_averages[cat] = round(total / cnt, 1) if cnt > 0 else 75.0

    # Calculate career match alignment
    career_matches = {}
    for career_name, data in CAREER_BENCHMARKS.items():
        career_score = 0.0
        weight_sum = 0.0
        for cat, weight in data["weights"].items():
            cat_score = category_averages.get(cat, 70.0)
            career_score += cat_score * weight
            weight_sum += weight
        
        final_score = round(career_score / weight_sum, 1) if weight_sum > 0 else 70.0
        career_matches[career_name] = {
            "match_percentage": min(98.5, max(45.0, final_score)),
            "recommended_skills": data["critical_skills"]
        }

    # Find highest matching career
    best_fit = max(career_matches.items(), key=lambda x: x[1]["match_percentage"])

    return {
        "domain_scores": category_averages,
        "career_matches": career_matches,
        "primary_recommendation": best_fit[0],
        "top_match_score": best_fit[1]["match_percentage"],
        "evaluated_at_timestamp": datetime.datetime.utcnow().isoformat()
    }
import datetime
