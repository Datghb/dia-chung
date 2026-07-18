"""Command-line entry point."""

import argparse

from backend.legal_radar.pipeline import analyze_comment
from backend.legal_radar.report import render_json


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("comment")
    args = parser.parse_args()
    print(render_json(analyze_comment(args.comment)))


if __name__ == "__main__":
    main()
