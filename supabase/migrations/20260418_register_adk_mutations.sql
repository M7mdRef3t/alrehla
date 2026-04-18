-- Registering ADK-driven mutations
INSERT INTO ui_mutations (component_id, variant_name, variant_path, hypothesis, is_active)
VALUES 
('HeroSection', 'v2_performance_plus', 'HeroSection/v2_performance_plus', 'Simplifying framer-motion complexity and adding will-change transforms will reduce perceived lag (120ms -> <50ms).', true),
('OnboardingFlow', 'v1_trust_shield', 'OnboardingFlow/v1_trust_shield', 'Contextual sovereignty trust banner will reduce hesitation drop-off during goal selection.', true)
ON CONFLICT (component_id, variant_name) DO UPDATE 
SET variant_path = EXCLUDED.variant_path,
    hypothesis = EXCLUDED.hypothesis,
    is_active = EXCLUDED.is_active;
