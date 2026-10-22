import pytest
from unittest.mock import patch, MagicMock
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.ai_service import generate_summary, generate_explanation, AIResponse


def test_generate_summary_mocked():
    mock_resp = MagicMock()
    mock_resp.text = (
        "## Overview\nThis text examines photosynthesis.\n\n"
        "## Key Concepts & Main Ideas\n- Light-dependent reactions convert photons to ATP.\n\n"
        "## Essential Terminology & Definitions\n- **Chlorophyll**: Green pigment capturing light.\n\n"
        "## Key Takeaways & Conclusion\n- Provides foundational energy for ecosystems."
    )

    with patch("services.ai_service.is_gemini_configured", return_value=True):
        with patch("services.ai_service.get_gemini_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.models.generate_content.return_value = mock_resp
            mock_get_client.return_value = mock_client

            result = generate_summary(
                text="Photosynthesis is the process used by plants to convert light energy into chemical energy.",
                title="Biology Notes"
            )

            assert isinstance(result, AIResponse)
            assert result.action == "summary"
            assert "photosynthesis" in result.content.lower()
            assert result.chunks_processed == 1


def test_generate_explanation_mocked():
    mock_resp = MagicMock()
    mock_resp.text = (
        "## The Big Picture\nImagine a solar-powered sugar bakery inside every leaf.\n\n"
        "## Step-by-Step Breakdown\n1. Sun hits leaf.\n2. Water splits.\n3. Sugar forms.\n\n"
        "## Intuitive Analogy\nLike charging a portable power bank during sunny days."
    )

    with patch("services.ai_service.is_gemini_configured", return_value=True):
        with patch("services.ai_service.get_gemini_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.models.generate_content.return_value = mock_resp
            mock_get_client.return_value = mock_client

            result = generate_explanation(
                text="Photosynthesis converts solar radiation into biochemical reserves.",
                title="Leaf Energy"
            )

            assert isinstance(result, AIResponse)
            assert result.action == "explanation"
            assert "Step-by-Step Breakdown" in result.content
