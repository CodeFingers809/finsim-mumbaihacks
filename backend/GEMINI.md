# GEMINI.md

## Project Principles

1.  **Simplicity First**: Keep the API very simple. Avoid unnecessary complexity or "extra shit".
2.  **Extensibility**: Code should be easily human-readable, changeable, and extensible.
3.  **Minimal Dependencies**: No bloat libraries. Use standard tools and lightweight libraries where possible.
4.  **No Git Repository**: This project is managed without a git repository (or at least, git operations are not the focus/enforced).
5.  **No Extra Code**: Do not add code that isn't immediately useful or requested. Avoid over-engineering.
6.  **Testing**: Provide `curl` commands for Postman/manual testing for every new route created, instead of writing test scripts. Always use `localhost:3001`. Never use `127.0.0.1`.
