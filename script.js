// ENTER YOUR API KEY
const API_KEY = "";

const output = document.getElementById("output");
document.getElementById("models").addEventListener("change", show_options);

function show_options(event) {
  const value = event.target.value;

  if (value === "gpt-4-turbo-preview" || value === "gpt-3.5-turbo-0125") {
    showGPTOptions();
  } else if (value === "dall-e-3") {
    showDalleOptions();
  } else if (value === "tts-1") {
    showTTSOptions();
  } else if (value === "gpt-4-vision-preview") {
    showVisionOptions();
  }
}

function showGPTOptions() {
  $("#dalle_options, #info, #vision_options, #tts_options, #player").hide();
  $("#output").show();
  $("#prompt").attr("required", "");
}

function showTTSOptions() {
  $("#player, #tts_options").show();
  $("#dalle_options, #info, #vision_options, #output").hide();
  $("#uploaded_image").removeAttr("required");
  $("#prompt").attr("required", "");
}

function showVisionOptions() {
  $("#vision_options, #output").show();
  $("#dalle_options, #info, #tts_options, #player").hide();
  $("#prompt").removeAttr("required");
  $("#uploaded_image").attr("required", "");
}

function showDalleOptions() {
  $("#dalle_options, #info, #output").show();
  $("#vision_options, #tts_options, #player").hide();
  $("#prompt").attr("required", "");
  $("#uploaded_image").removeAttr("required");
}

function runAI(event) {
  event.preventDefault();
  const prompt = $("#prompt");

  let chosen_model = $("#models").val();
  let data = {};
  let endpoint = "";

  // GPT4
  if (chosen_model == "gpt-4-turbo-preview" || chosen_model == "gpt-3.5-turbo-0125") {
    endpoint = "chat/completions";
    data = {
      model: chosen_model,
      messages: [{ role: "user", content: prompt.val() }],
      temperature: 0.7,
      // max_tokens: 64,
    };
  }
  // TTS
  else if (chosen_model == "tts-1") {
    endpoint = "audio/speech";
    data = {
      model: chosen_model,
      input: prompt.val(),
      voice: $("#tts_voice").val(),
    };
  }
  // DALLe-3
  else if (chosen_model == "dall-e-3") {
    endpoint = "images/generations";
    data = {
      model: chosen_model,
      prompt: prompt.val(),
      quality: $("#dalle_image_quality").val(),
      style: $("#dalle_style").val(),
      n: 1,
      size: $("#dalle_resolution").val(),
    };
  }
  // VISION
  else if (chosen_model == "gpt-4-vision-preview") {
    endpoint = "chat/completions";
    data = {
      model: chosen_model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What’s in this image?" },
            {
              type: "image_url",
              image_url: {
                url: uploaded_image,
                detail: $("#vision_detail").val(),
              },
            },
          ],
        },
      ],
      max_tokens: $("#tokens_vision").val() ? parseInt($("#tokens_vision").val(), 10) : 20,
    };
  }

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(data),
  };
  // console.log(data);
  // throw new Error("DEBUG");
  api_call(options, endpoint, chosen_model);
  show_loading();
}

async function api_call(options, endpoint, chosen_model) {
  try {
    const response = await fetch(`https://api.openai.com/v1/${endpoint}`, options);
    if (chosen_model != "tts-1") {
      const result = await response.json();
      await display_result(result, chosen_model);
      console.log(
        "%c Result -",
        "font-weight:bold",
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        result
      );
    } else {
      const result = await response.blob();
      await display_result(result, chosen_model);
    }
  } catch (error) {
    console.error("An error occurred:", error);
    alert("An error occurred. Please check the console for details.");
  }
}

function add_header_to_code_block() {
  if ($("code").length) {
    const lang = $("code").attr("class").split(" ")[0].split("-")[1];
    // console.log(lang);
    let header_div = `<div class="header_div"><div>${lang}</div><div class="copyBtn" onclick="copyCode()">copy</div></div>`;
    $(header_div).prependTo("pre");
  } else {
    console.log("response doesnt include <code> tags");
  }
}

function display_result(result, chosen_model) {
  close_loading();
  $(".output_area").show();
  // check which model was used
  if (
    chosen_model === "gpt-4-turbo-preview" ||
    chosen_model === "gpt-3.5-turbo-0125" ||
    chosen_model === "gpt-4-vision-preview"
  ) {
    output.innerHTML = marked.parse(result.choices[0].message.content);
    hljs.highlightAll();
    add_header_to_code_block();
  } else if (chosen_model === "dall-e-3") {
    output.innerHTML = marked.parse(`![Generated Image](${result.data[0].url})`);
    $("#info").html(
      `<a href="${result.data[0].url}">Full Size Image</a><br><br><b>Revised Prompt:</b><br>${result.data[0].revised_prompt}`
    );
  } else if (chosen_model === "tts-1") {
    var url = URL.createObjectURL(result);
    $("#player").attr("src", url);
  }
}

function show_loading() {
  $("#loading_main").show();
  output.classList.add("placeholder");
}

function close_loading() {
  $("#loading_main").hide();
  output.classList.remove("placeholder");
}

function previewImage(event) {
  const reader = new FileReader();
  reader.onload = function () {
    $("#image-preview").attr("src", reader.result);
    $("#image-preview").show();
    uploaded_image = reader.result;
  };
  reader.readAsDataURL(event.target.files[0]);
}

document.getElementById("btnSwitch").addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-bs-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-bs-theme", newTheme);
});

async function get_usage() {
  try {
    const formattedDate = new Date().toISOString().slice(0, 10);
    const response = await fetch(`https://api.openai.com/v1/usage?date=${formattedDate}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch usage data");
    const result = await response.json();
    console.log(
      "%c Usage checked at",
      "font-weight:bold",
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      result
    );
    showUsage(calculateTotalUsage(result));
  } catch (error) {
    console.error("An error occurred:", error);
    alert("An error occurred. Please check the console for details.");
  }
}

function copyCode() {
  var codeBlock = document.querySelector("code");
  navigator.clipboard.writeText(codeBlock.innerText);
}

function calculateTotalUsage(data) {
  const prices = {
    "gpt-3.5-turbo-0125": {
      n_context_tokens_total: 0.0005,
      n_generated_tokens_total: 0.0015,
    },
    "gpt-4-1106-vision-preview": {
      n_context_tokens_total: 0.01,
      n_generated_tokens_total: 0.03,
    },
    "gpt-4-0125-preview": {
      n_context_tokens_total: 0.01,
      n_generated_tokens_total: 0.03,
    },
    "dall-e-3": {
      generations: 0.08,
    },
    "tts-1": {
      speech: 0.015,
    },
  };
  // Initialize the total usage as zero

  let totalUsage = 0;

  // Initialize the variables for the input tokens, output tokens, requests, images, and characters for each model and operation

  let gpt3 = {
    n_context_tokens_total: 0,
    n_generated_tokens_total: 0,
  };
  let gpt4 = {
    n_context_tokens_total: 0,
    n_generated_tokens_total: 0,
  };
  let gpt4Vision = {
    n_context_tokens_total: 0,
    n_generated_tokens_total: 0,
  };
  let dalleApiTotals = {
    totalNumImages: 0,
  };
  let ttsTotals = {
    totalCharacters: 0,
  };

  // Loop through the data arrays for each model and operation
  for (let key in data) {
    // Skip the non-array properties
    if (!Array.isArray(data[key])) continue;

    // Loop through the objects in each array
    for (let obj of data[key]) {
      // Get the model id and the operation from the object
      let modelId = obj.model_id || obj.snapshot_id;

      // Get the values of the input tokens, output tokens, requests, images, and characters from the object
      let inputTokens = obj.n_context_tokens_total || 0;
      let outputTokens = obj.n_generated_tokens_total || 0;
      let images = obj.num_images || 0;
      let characters = obj.num_characters || 0;
      let cost = 0;

      // Update the variables for the input tokens, output tokens, requests, images, and characters for each model and operation
      if (modelId === "gpt-4-0125-preview") {
        gpt4.n_context_tokens_total += inputTokens;
        gpt4.n_generated_tokens_total += outputTokens;
        cost =
          (inputTokens * prices[modelId].n_context_tokens_total +
            outputTokens * prices[modelId].n_generated_tokens_total) /
          1000;
      } else if (modelId === "gpt-4-1106-vision-preview") {
        gpt4Vision.n_context_tokens_total += inputTokens;
        gpt4Vision.n_generated_tokens_total += outputTokens;
        cost =
          (inputTokens * prices[modelId].n_context_tokens_total +
            outputTokens * prices[modelId].n_generated_tokens_total) /
          1000;
      } else if (modelId === "dall-e-3") {
        dalleApiTotals.totalNumImages += images;
        cost = images * prices[modelId].generations;
      } else if (modelId === "tts-1") {
        ttsTotals.totalCharacters += characters;
        cost = (characters * prices[modelId].speech) / 1000;
      } else if (modelId === "gpt-3.5-turbo-0125") {
        gpt3.n_context_tokens_total += inputTokens;
        gpt3.n_generated_tokens_total += outputTokens;
        cost =
          (inputTokens * prices[modelId].n_context_tokens_total +
            outputTokens * prices[modelId].n_generated_tokens_total) /
          1000;
      }

      totalUsage += cost;
    }
  }
  totalUsage = totalUsage.toFixed(2);

  // Return the total usage and the variables for the input tokens, output tokens, requests, images, and characters for each model and operation
  return {
    totalUsage,
    gpt3,
    gpt4,
    gpt4Vision,
    dalleApiTotals,
    ttsTotals,
  };
}

function showUsage(usage) {
  document.getElementById("usage").innerHTML = `
                          GPT 3: Input: ${usage.gpt3.n_context_tokens_total} / Generated: ${usage.gpt3.n_generated_tokens_total}<br>
                          GPT 4: Input: ${usage.gpt4.n_context_tokens_total} / Generated: ${usage.gpt4.n_generated_tokens_total}<br>
                          GPT 4 Vision: Input: ${usage.gpt4Vision.n_context_tokens_total} / Generated: ${usage.gpt4Vision.n_generated_tokens_total}<br>
                          Dalle 3: Total Images: ${usage.dalleApiTotals.totalNumImages}<br>
                          TTS: Total Characters: ${usage.ttsTotals.totalCharacters}<br>
                          Total Cost: $${usage.totalUsage}
                        `;
}

get_usage();
