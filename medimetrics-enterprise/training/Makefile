.PHONY: help setup train evaluate export

help:
	@echo "MediMetrics Model Training Commands"
	@echo "=================================="
	@echo "setup       - Install dependencies and prepare environment"
	@echo "prepare-data - Prepare datasets for training"
	@echo "train       - Start training with default config"
	@echo "train-chex  - Train CheXNet model"
	@echo "train-unet  - Train UNet segmentation model"
	@echo "evaluate    - Evaluate trained model"
	@echo "export      - Export model to ONNX format"
	@echo "mlflow      - Start MLflow tracking server"
	@echo "jupyter     - Start Jupyter Lab"
	@echo "tensorboard - Start TensorBoard"

setup:
	pip install poetry
	poetry install
	poetry run pre-commit install

prepare-data:
	poetry run python scripts/prepare_dataset.py \
		--input-dir ../data/raw \
		--output-dir ../data/processed \
		--split-ratio 0.7:0.15:0.15

train-chex:
	poetry run python scripts/train.py \
		--config config/models/densenet121_chex.yaml

train-unet:
	poetry run python scripts/train.py \
		--config config/models/unet_segmentation.yaml

evaluate:
	poetry run python scripts/evaluate.py \
		--model-path models/densenet121_chex_final.pt \
		--config config/models/densenet121_chex.yaml \
		--test-dir ../data/test

export:
	poetry run python scripts/export_model.py \
		--model-path models/densenet121_chex_final.pt \
		--output-format onnx \
		--optimize

hyperparameter-search:
	poetry run python scripts/hyperparameter_search.py \
		--config config/models/densenet121_chex.yaml \
		--n-trials 50 \
		--study-name chexnet-optimization

mlflow:
	docker compose -f docker-compose.training.yml up mlflow -d

jupyter:
	docker compose -f docker-compose.training.yml up jupyter -d
	@echo "Jupyter Lab running at http://localhost:8888"

tensorboard:
	docker compose -f docker-compose.training.yml up tensorboard -d
	@echo "TensorBoard running at http://localhost:6006"

distributed-train:
	torchrun --nproc_per_node=4 \
		scripts/train.py \
		--config config/models/densenet121_chex.yaml \
		--distributed

clean:
	rm -rf checkpoints/ logs/ mlruns/ .pytest_cache/
	find . -type d -name __pycache__ -exec rm -rf {} +