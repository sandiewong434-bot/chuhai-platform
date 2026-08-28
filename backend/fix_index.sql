CREATE INDEX IF NOT EXISTS idx_articles_search ON articles USING gin(to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,'')));
