-- 20260418_fix_mutation_constraint.sql
-- Adding unique constraint to allow ON CONFLICT updates for mutations

ALTER TABLE ui_mutations 
ADD CONSTRAINT ui_mutations_component_variant_unique UNIQUE (component_id, variant_name);
