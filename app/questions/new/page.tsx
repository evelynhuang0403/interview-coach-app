import { AppFrame } from "@/components/AppFrame";
import { QuestionForm } from "@/components/QuestionForm";

export default function NewQuestionPage() {
  return (
    <AppFrame>
      <div className="topbar">
        <div>
          <h1>New Question</h1>
          <p>Add a question to your review bank.</p>
        </div>
      </div>
      <QuestionForm />
    </AppFrame>
  );
}
