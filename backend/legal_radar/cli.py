"""Command-line entry point."""

import argparse

from .pipeline import analyze_comment
from .report import render_json


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("comment")
    args = parser.parse_args()
    print(render_json(analyze_comment(args.comment)))


if __name__ == "__main__":
    main()
