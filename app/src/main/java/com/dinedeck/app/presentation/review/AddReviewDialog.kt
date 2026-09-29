package com.dinedeck.app.presentation.review

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dinedeck.app.core.designsystem.*
import com.dinedeck.app.domain.repository.OrderRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AddReviewViewModel @Inject constructor(
    private val orderRepository: OrderRepository
) : ViewModel() {

    private val _isSubmitted = MutableStateFlow(false)
    val isSubmitted: StateFlow<Boolean> = _isSubmitted.asStateFlow()

    fun submitReview(orderId: String, restRating: Float, foodRating: Float, comment: String) {
        viewModelScope.launch {
            orderRepository.submitReview(orderId, restRating, foodRating, comment)
            _isSubmitted.value = true
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddReviewDialog(
    orderId: String,
    onDismiss: () -> Unit,
    viewModel: AddReviewViewModel = hiltViewModel()
) {
    var restRating by remember { mutableStateOf(5f) }
    var foodRating by remember { mutableStateOf(5f) }
    var comment by remember { mutableStateOf("") }

    val isSubmitted by viewModel.isSubmitted.collectAsState()

    LaunchedEffect(isSubmitted) {
        if (isSubmitted) {
            onDismiss()
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = DarkSurface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp)
        ) {
            Text("Rate Your Dining Experience", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(16.dp))

            Text("Restaurant Ambience & Service", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
            Spacer(modifier = Modifier.height(4.dp))
            RatingBar(rating = restRating, onRatingChanged = { restRating = it })

            Spacer(modifier = Modifier.height(16.dp))

            Text("Food Quality & Taste", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
            Spacer(modifier = Modifier.height(4.dp))
            RatingBar(rating = foodRating, onRatingChanged = { foodRating = it })

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = comment,
                onValueChange = { comment = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Your Review / Feedback") },
                placeholder = { Text("Tell us what you loved about your meal...", color = TextMuted) },
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = OrangePrimary,
                    unfocusedBorderColor = DarkBorder,
                    focusedTextColor = TextPrimary,
                    unfocusedTextColor = TextPrimary
                )
            )

            Spacer(modifier = Modifier.height(24.dp))

            DineDeckButton(
                text = "Submit Feedback",
                onClick = { viewModel.submitReview(orderId, restRating, foodRating, comment) },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}

@Composable
fun RatingBar(rating: Float, onRatingChanged: (Float) -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        (1..5).forEach { index ->
            Icon(
                imageVector = if (index <= rating) Icons.Default.Star else Icons.Outlined.StarBorder,
                contentDescription = "Star $index",
                tint = AmberAccent,
                modifier = Modifier
                    .size(32.dp)
                    .clickable { onRatingChanged(index.toFloat()) }
                    .padding(2.dp)
            )
        }
    }
}
