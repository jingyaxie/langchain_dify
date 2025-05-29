#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import subprocess
import sys
import os


def run_command(command, cwd=None):
    """Run command and return result"""
    try:
        result = subprocess.Popen(
            command, 
            shell=True, 
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=cwd
        )
        stdout, stderr = result.communicate()
        return result.returncode, stdout.decode('utf-8'), stderr.decode('utf-8')
    except Exception as e:
        return 1, "", str(e)


def check_python_dependencies():
    """Check Python dependencies"""
    print("[INFO] Checking backend Python dependencies...")
    
    # Check if in virtual environment
    in_venv = hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)
    venv_status = "ACTIVE" if in_venv else "NOT_ACTIVE"
    print("[INFO] Virtual environment status: " + venv_status)
    
    # Check if local venv exists
    venv_path = os.path.join("backend", "venv")
    if os.path.exists(venv_path):
        print("[INFO] Local virtual environment found: backend/venv")
    else:
        print("[WARN] Local virtual environment not found")
        print("[SUGGEST] Run: python3.11 -m venv backend/venv")
        return False
    
    # Check if requirements.txt exists
    backend_req = os.path.join("backend", "requirements.txt")
    if not os.path.exists(backend_req):
        print("[ERROR] backend/requirements.txt not found")
        return False
    
    # Check if dependencies are installed in venv
    fastapi_check = os.path.join(venv_path, "lib", "python*", "site-packages", "fastapi")
    code, stdout, stderr = run_command("ls " + fastapi_check)
    if code != 0:
        print("[WARN] Dependencies not installed in virtual environment")
        print("[SUGGEST] Run: cd backend && source venv/bin/activate && pip install -r requirements.txt")
        return False
    
    print("[OK] Python dependencies check completed")
    return True


def check_node_dependencies():
    """Check Node.js dependencies"""
    print("\n[INFO] Checking frontend Node.js dependencies...")
    
    # Check if package.json exists
    frontend_pkg = os.path.join("frontend", "package.json")
    if not os.path.exists(frontend_pkg):
        print("[ERROR] frontend/package.json not found")
        return False
    
    # Check if node_modules exists
    node_modules = os.path.join("frontend", "node_modules")
    if not os.path.exists(node_modules):
        print("[WARN] node_modules not found")
        print("[SUGGEST] Run: cd frontend && npm install")
        return False
    
    # Check for security vulnerabilities
    print("[INFO] Checking for security vulnerabilities...")
    code, stdout, stderr = run_command("npm audit", cwd="frontend")
    
    if code != 0 and "vulnerabilities" in stdout.lower():
        print("[WARN] Security vulnerabilities found:")
        output = stdout[:500] + "..." if len(stdout) > 500 else stdout
        print(output)
        print("\n[SUGGEST] Run 'npm audit fix' to fix automatically")
        print("[SUGGEST] For breaking changes, use 'npm audit fix --force' carefully")
        return False
    
    print("[OK] Node.js dependencies check completed")
    return True


def check_environment_config():
    """Check environment configuration"""
    print("\n[INFO] Checking environment configuration...")
    
    # Check for env.example
    if not os.path.exists("env.example"):
        print("[WARN] env.example not found")
        return False
    
    # Check for .env file
    if not os.path.exists(".env"):
        print("[WARN] .env file not found")
        print("[SUGGEST] Run: cp env.example .env")
        return False
    
    print("[OK] Environment configuration check completed")
    return True


def check_docker_config():
    """Check Docker configuration"""
    print("\n[INFO] Checking Docker configuration...")
    
    required_files = [
        "docker-compose.yml",
        os.path.join("backend", "Dockerfile"),
        os.path.join("frontend", "Dockerfile")
    ]
    
    missing_files = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        print("[ERROR] Missing Docker config files: " + ", ".join(missing_files))
        return False
    
    print("[OK] Docker configuration check completed")
    return True


def check_core_modules():
    """Check core modules"""
    print("\n[INFO] Checking core modules...")
    
    required_modules = [
        os.path.join("backend", "app", "main.py"),
        os.path.join("backend", "app", "core", "config.py"), 
        os.path.join("backend", "app", "core", "api_client.py"),
        os.path.join("frontend", "package.json"),
        os.path.join("frontend", "next.config.js")
    ]
    
    missing_modules = []
    for module_path in required_modules:
        if not os.path.exists(module_path):
            missing_modules.append(module_path)
    
    if missing_modules:
        print("[ERROR] Missing core modules: " + ", ".join(missing_modules))
        return False
    
    print("[OK] Core modules check completed")
    return True


def check_local_dev_setup():
    """Check local development setup"""
    print("\n[INFO] Checking local development setup...")
    
    # Check for startup script
    if not os.path.exists("start-local-dev.sh"):
        print("[WARN] start-local-dev.sh not found")
        return False
    
    # Check for required directories
    required_dirs = ["uploads", "chroma_data", "logs"]
    missing_dirs = []
    for dir_path in required_dirs:
        if not os.path.exists(dir_path):
            missing_dirs.append(dir_path)
    
    if missing_dirs:
        print("[INFO] Creating missing directories: " + ", ".join(missing_dirs))
        for dir_path in missing_dirs:
            try:
                os.makedirs(dir_path, exist_ok=True)
            except:
                print("[ERROR] Failed to create directory: " + dir_path)
                return False
    
    print("[OK] Local development setup completed")
    return True


def generate_report():
    """Generate dependency check report"""
    print("\n" + "="*50)
    print("DEPENDENCY CHECK REPORT - LOCAL DEVELOPMENT")
    print("="*50)
    
    results = {
        "Python Dependencies": check_python_dependencies(),
        "Node.js Dependencies": check_node_dependencies(), 
        "Environment Config": check_environment_config(),
        "Docker Config": check_docker_config(),
        "Core Modules": check_core_modules(),
        "Local Dev Setup": check_local_dev_setup()
    }
    
    print("\nCHECK RESULTS:")
    for category, result in results.items():
        status = "PASS" if result else "FAIL"
        print("  " + category + ": " + status)
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\nSUCCESS: All checks passed! Ready for local development.")
        print("\nQUICK START:")
        print("  ./start-local-dev.sh")
        print("\nOR MANUAL START:")
        print("  1. Backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload")
        print("  2. Frontend: cd frontend && npm run dev")
    else:
        print("\nWARNING: Issues found. Please fix according to suggestions above.")
        print("\nAUTO SETUP:")
        print("  ./start-local-dev.sh  # Will auto-fix most issues")
    
    return all_passed


if __name__ == "__main__":
    success = generate_report()
    sys.exit(0 if success else 1) 