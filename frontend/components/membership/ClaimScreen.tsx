import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ClaimScreenProps {
  onSuccess: () => void;
}

export default function ClaimScreen({ onSuccess }: ClaimScreenProps) {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/dashboard");
  }, [navigate]);
  
  return null;
}
