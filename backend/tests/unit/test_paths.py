from backend.legal_radar.paths import data_dir, repo_root


def test_data_directory_contains_knowledge_graph() -> None:
    assert (data_dir() / "kg" / "kg_nodes.json").is_file()
    assert data_dir() == repo_root() / "data"
