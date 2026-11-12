import { Navigate, useSearchParams } from 'react-router-dom';
import IncidentEditor from './IncidentEditor';

/* The Building Structure Assessment Form (FORM/BUILDING STRUCTURE ASSESSMENT
   FORM.docx) as its own sidebar destination. The editor already carries the
   form's title, section rail, validation and local-first autosave, so the tab
   only has to pin the draft to the building form type. */
export default function StructureAssessment() {
  const [params] = useSearchParams();

  if (params.get('type') !== 'building') {
    return <Navigate to="/structure-assessment?type=building" replace />;
  }

  return <IncidentEditor />;
}
