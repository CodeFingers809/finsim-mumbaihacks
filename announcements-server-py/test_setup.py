"""
Test script for Qdrant-based announcement system.
Run this to verify your setup is working correctly.
"""

import sys
import os
from dotenv import load_dotenv

load_dotenv()

def test_environment():
    """Check if all required environment variables are set"""
    print("🔍 Checking environment variables...")
    
    required_vars = [
        "QDRANT_URL",
        "QDRANT_API_KEY",
        "VLLM_EMBEDDING_URL",
    ]
    
    optional_vars = [
        "SPLADE_EMBEDDING_URL",
        "NEXTJS_NOTIFY_URL",
        "WHATSAPP_SERVER_URL",
    ]
    
    all_ok = True
    for var in required_vars:
        if os.getenv(var):
            print(f"   ✅ {var}")
        else:
            print(f"   ❌ {var} - MISSING (required)")
            all_ok = False
    
    for var in optional_vars:
        if os.getenv(var):
            print(f"   ✅ {var}")
        else:
            print(f"   ⚠️  {var} - not set (optional)")
    
    return all_ok


def test_qdrant_connection():
    """Test connection to Qdrant"""
    print("\n🔍 Testing Qdrant connection...")
    
    try:
        from qdrant_client import QdrantClient
        
        url = os.getenv("QDRANT_URL")
        api_key = os.getenv("QDRANT_API_KEY")
        
        client = QdrantClient(url=url, api_key=api_key, timeout=10)
        collections = client.get_collections()
        
        print(f"   ✅ Connected to Qdrant")
        print(f"   📊 Found {len(collections.collections)} collections")
        
        for coll in collections.collections:
            print(f"      - {coll.name}")
        
        return True
    except Exception as e:
        print(f"   ❌ Failed to connect: {e}")
        return False


def test_vllm_endpoint():
    """Test vLLM embedding endpoint"""
    print("\n🔍 Testing vLLM endpoint...")
    
    try:
        import requests
        
        url = os.getenv("VLLM_EMBEDDING_URL")
        response = requests.post(
            url,
            json={"input": ["test query"]},
            timeout=10
        )
        
        if response.ok:
            data = response.json()
            embedding = data["data"][0]["embedding"]
            print(f"   ✅ vLLM endpoint working")
            print(f"   📏 Embedding dimension: {len(embedding)}")
            return True
        else:
            print(f"   ❌ vLLM returned error: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Failed to reach vLLM: {e}")
        return False


def test_splade_endpoint():
    """Test SPLADE endpoint (optional)"""
    print("\n🔍 Testing SPLADE endpoint...")
    
    url = os.getenv("SPLADE_EMBEDDING_URL")
    if not url:
        print("   ⏭️  SPLADE_EMBEDDING_URL not set, skipping")
        return True
    
    try:
        import requests
        
        response = requests.post(
            url,
            json={"input": ["test query"]},
            timeout=10
        )
        
        if response.ok:
            data = response.json()
            embedding = data["data"][0]["embedding"]
            print(f"   ✅ SPLADE endpoint working")
            print(f"   📏 Sparse vectors: {len(embedding['indices'])} tokens")
            return True
        else:
            print(f"   ⚠️  SPLADE returned error: {response.status_code}")
            print(f"   💡 Will fallback to local fastembed")
            return True
    except Exception as e:
        print(f"   ⚠️  Failed to reach SPLADE: {e}")
        print(f"   💡 Will fallback to local fastembed")
        return True


def test_qdrant_storage():
    """Test QdrantAnnouncementStore"""
    print("\n🔍 Testing QdrantAnnouncementStore...")
    
    try:
        from qdrant_storage import QdrantAnnouncementStore
        
        store = QdrantAnnouncementStore()
        print("   ✅ QdrantAnnouncementStore initialized")
        
        # Test embedding generation
        print("   🔢 Testing dense embedding generation...")
        dense = store.get_dense_embedding("test announcement")
        print(f"   ✅ Dense embedding: {len(dense)} dimensions")
        
        print("   🔢 Testing sparse embedding generation...")
        sparse = store.get_sparse_embedding("test announcement")
        print(f"   ✅ Sparse embedding: {len(sparse['indices'])} tokens")
        
        return True
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        return False


def test_mock_announcement():
    """Create a mock announcement and search for users"""
    print("\n🔍 Testing mock announcement storage and search...")
    
    try:
        from qdrant_storage import QdrantAnnouncementStore
        
        store = QdrantAnnouncementStore()
        
        # Create test announcement
        print("   📝 Creating test announcement...")
        point_id = store.store_announcement(
            text="HDFC Bank has declared an interim dividend of Rs 19 per share for FY24.",
            metadata={
                "stock_code": "500180",
                "stock_name": "HDFC Bank",
                "category": "Dividend",
                "subject": "Interim Dividend Declaration",
                "date_time": "2025-12-27 18:00",
                "pdf_url": "https://example.com/test.pdf",
                "file_hash": "test_announcement_123",
            }
        )
        print(f"   ✅ Stored with ID: {point_id[:8]}...")
        
        # Search for matching users
        print("   🔍 Searching for matching users...")
        matches = store.find_matching_users(
            announcement_text="HDFC Bank dividend announcement",
            stock_code="500180"
        )
        print(f"   ✅ Found {len(matches)} matching users")
        
        if matches:
            for match in matches:
                print(f"      - User {match['userId'][:8]}... (score: {match['score']:.3f})")
        else:
            print("   💡 No users subscribed yet. Subscribe via UI first!")
        
        return True
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    print("=" * 60)
    print("BSE WhatsApp Alert System - Test Suite")
    print("=" * 60)
    
    results = []
    
    # Run tests
    results.append(("Environment", test_environment()))
    results.append(("Qdrant Connection", test_qdrant_connection()))
    results.append(("vLLM Endpoint", test_vllm_endpoint()))
    results.append(("SPLADE Endpoint", test_splade_endpoint()))
    results.append(("QdrantAnnouncementStore", test_qdrant_storage()))
    results.append(("Mock Announcement", test_mock_announcement()))
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status:10} {name}")
    
    print("=" * 60)
    
    all_passed = all(result[1] for result in results if result[0] in ["Environment", "Qdrant Connection", "vLLM Endpoint"])
    
    if all_passed:
        print("\n🎉 All critical tests passed! System is ready.")
        print("\nNext steps:")
        print("  1. Start the monitor: python monitor_qdrant.py")
        print("  2. Subscribe via UI: http://localhost:3000/alerts")
        print("  3. Watch for new announcements!")
    else:
        print("\n⚠️  Some tests failed. Fix the issues above before proceeding.")
        sys.exit(1)


if __name__ == "__main__":
    main()
